import { whenever } from '@vueuse/core';
import { Address, Hex, Transaction } from 'viem';
import { computed, onMounted, Ref, ref } from 'vue';

import { MessageSender, PermissionRequest } from '@/background/provider';
import useProviderStore from '@/stores/provider';

import { useWallet } from './useWallet';

interface UseProvider {
  sender: Ref<MessageSender | null>;

  isRequestingAccounts: Ref<boolean>;
  allowAccountRequest: () => void;
  denyAccountRequest: () => void;

  isPersonalSigning: Ref<boolean>;
  personalSignedMessage: Ref<Hex | null>;
  allowPersonalSign: () => void;
  denyPersonalSign: () => void;

  isSendingTransaction: Ref<boolean>;
  transaction: Ref<Transaction | null>;
  allowSendTransaction: () => void;
  denySendTransaction: () => void;

  delegate: (
    delegatee: Address,
    data: Hex,
    cb: (txHash: Hex | null) => void,
  ) => Promise<void>;

  isRequestingPermissions: Ref<boolean>;
  permissionRequest: Ref<PermissionRequest | null>;
  allowRequestPermissions: () => void;
  denyRequestPermissions: () => void;
}

function useProvider(): UseProvider {
  const store = useProviderStore();

  const wallet = useWallet();

  const requestId = computed<string | number>(() => store.requestId);
  const requestSender = computed<MessageSender | null>(
    () => store.requestSender,
  );

  const delegationCallback = ref<((txHash: Hex | null) => void) | null>(null);

  const isRequestingAccounts = computed<boolean>(
    () => store.isRequestingAccounts,
  );
  function allowAccountRequest(): void {
    const addresses = wallet.address.value ? [wallet.address.value] : [];
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'ALLOW_ACCOUNT_REQUEST',
      data: addresses,
    });
    store.setIsRequestingAccounts(false);
  }
  function denyAccountRequest(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'DENY_ACCOUNT_REQUEST',
    });
    store.setIsRequestingAccounts(false);
  }

  const isPersonalSigning = computed<boolean>(() => store.isPersonalSigning);
  const personalSignedMessage = computed<Hex | null>(
    () => store.personalSignedMessage,
  );
  function allowPersonalSign(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'ALLOW_PERSONAL_SIGN',
      data: personalSignedMessage.value,
    });
    store.setIsPersonalSigning(false);
  }
  function denyPersonalSign(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'DENY_PERSONAL_SIGN',
    });
    store.setIsPersonalSigning(false);
  }

  const isSendingTransaction = computed<boolean>(
    () => store.isSendingTransaction,
  );
  const transaction = computed<Transaction | null>(() => store.transaction);
  function allowSendTransaction(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'ALLOW_SEND_TRANSACTION',
      data: transaction.value,
    });
    store.setIsSendingTransaction(false);
  }
  function denySendTransaction(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'DENY_SEND_TRANSACTION',
    });
    store.setIsSendingTransaction(false);
  }

  const delegationTxHash = computed<Hex | null>(() => store.delegationTxHash);
  async function delegate(
    delegatee: Address,
    data: Hex,
    cb: (txHash: Hex | null) => void,
  ): Promise<void> {
    chrome.runtime.sendMessage({
      type: 'DELEGATE',
      data: {
        delegatee,
        data,
      },
    });
    delegationCallback.value = cb;
  }
  whenever(delegationTxHash, (txHash) => {
    if (txHash) {
      if (delegationCallback.value) {
        delegationCallback.value(txHash);
        delegationCallback.value = null;
      }
    }
  });

  const isRequestingPermissions = computed<boolean>(
    () => store.isRequestingPermissions,
  );
  const permissionRequest = computed<PermissionRequest | null>(
    () => store.permissionRequest,
  );
  function allowRequestPermissions(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'ALLOW_REQUEST_PERMISSIONS',
      data: transaction.value,
    });
    store.setIsRequestingPermissions(false);
  }
  function denyRequestPermissions(): void {
    chrome.runtime.sendMessage({
      id: requestId.value,
      type: 'DENY_REQUEST_PERMISSIONS',
    });
    store.setIsRequestingPermissions(false);
  }

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'REQUEST_ACCOUNTS') {
          store.setIsRequestingAccounts(true);
          store.setRequestId(message.id);
        }
        if (message.type === 'PERSONAL_SIGN') {
          store.setIsPersonalSigning(true);
          store.setPersonalSignedMessage(message.data);
          store.setRequestId(message.id);
        }
        if (message.type === 'SEND_TRANSACTION') {
          store.setIsSendingTransaction(true);
          store.setTransaction(message.data);
          store.setRequestId(message.id);
        }
        if (message.type === 'DELEGATED') {
          const txHash = message.data.txHash;
          store.setDelegationTxHash(txHash);
        }
        if (message.type === 'REQUEST_PERMISSIONS') {
          store.setIsRequestingPermissions(true);
          store.setPermissionRequest(message.data);
          store.setRequestId(message.id);
        }
      });
    });
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PROVIDER_STATE',
    });
    store.setRequestId(response.requestId);
    store.setRequestSender(response.requestSender);
    store.setIsRequestingAccounts(response.isRequestingAccounts);
    store.setIsPersonalSigning(response.isPersonalSigning);
    store.setPersonalSignedMessage(response.personalSignedMessage);
    store.setIsSendingTransaction(response.isSendingTransaction);
    store.setTransaction(response.transaction);
    store.setIsRequestingPermissions(response.isRequestingPermissions);
    store.setPermissionRequest(response.permissionRequest);
  });

  return {
    sender: requestSender,

    isRequestingAccounts,
    allowAccountRequest,
    denyAccountRequest,

    isPersonalSigning,
    personalSignedMessage,
    allowPersonalSign,
    denyPersonalSign,

    isSendingTransaction,
    transaction,
    allowSendTransaction,
    denySendTransaction,

    delegate,

    isRequestingPermissions,
    permissionRequest,
    allowRequestPermissions,
    denyRequestPermissions,
  };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
