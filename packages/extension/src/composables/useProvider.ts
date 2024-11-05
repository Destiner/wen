import { whenever } from '@vueuse/core';
import { Address, Hex } from 'viem';
import { computed, onMounted, Ref, ref } from 'vue';

import {
  MessageSender,
  PermissionRequest,
  ProviderState,
  SendTransactionRequest,
} from '@/background/provider';
import {
  BackendRequestMessage,
  FrontendRequestMessage,
} from '@/background/types';
import useProviderStore from '@/stores/provider';

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
  transaction: Ref<SendTransactionRequest | null>;
  allowSendTransaction: () => void;
  denySendTransaction: () => void;

  delegate: (
    delegatee: Address,
    data: Hex,
    cb: (txHash: Hex | null) => void,
  ) => Promise<void>;
  undelegate: (cb: (txHash: Hex | null) => void) => Promise<void>;

  isRequestingPermissions: Ref<boolean>;
  permissionRequest: Ref<PermissionRequest | null>;
  allowRequestPermissions: () => void;
  denyRequestPermissions: () => void;

  personalSign: (
    message: Hex,
    cb: (signature: Hex | null) => void,
  ) => Promise<void>;
}

function useProvider(): UseProvider {
  const store = useProviderStore();

  const requestId = computed<string | number | null>(() => store.requestId);
  const requestSender = computed<MessageSender | null>(
    () => store.requestSender,
  );

  const delegationCallback = ref<((txHash: Hex | null) => void) | null>(null);
  const undelegationCallback = ref<((txHash: Hex | null) => void) | null>(null);
  const providerPersonalSignCallback = ref<
    ((signature: Hex | null) => void) | null
  >(null);

  const isRequestingAccounts = computed<boolean>(
    () => store.isRequestingAccounts,
  );
  function allowAccountRequest(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'ALLOW_ACCOUNT_REQUEST',
      data: undefined,
    });
    store.setIsRequestingAccounts(false);
  }
  function denyAccountRequest(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'DENY_ACCOUNT_REQUEST',
      data: undefined,
    });
    store.setIsRequestingAccounts(false);
  }

  const isPersonalSigning = computed<boolean>(() => store.isPersonalSigning);
  const personalSignedMessage = computed<Hex | null>(
    () => store.personalSignedMessage,
  );
  function allowPersonalSign(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'ALLOW_PERSONAL_SIGN',
      data: undefined,
    });
    store.setIsPersonalSigning(false);
  }
  function denyPersonalSign(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'DENY_PERSONAL_SIGN',
      data: undefined,
    });
    store.setIsPersonalSigning(false);
  }

  const isSendingTransaction = computed<boolean>(
    () => store.isSendingTransaction,
  );
  const transaction = computed<SendTransactionRequest | null>(
    () => store.transaction,
  );
  function allowSendTransaction(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'ALLOW_SEND_TRANSACTION',
      data: undefined,
    });
    store.setIsSendingTransaction(false);
  }
  function denySendTransaction(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'DENY_SEND_TRANSACTION',
      data: undefined,
    });
    store.setIsSendingTransaction(false);
  }

  const delegationTxHash = computed<Hex | null>(() => store.delegationTxHash);
  async function delegate(
    delegatee: Address,
    data: Hex,
    cb: (txHash: Hex | null) => void,
  ): Promise<void> {
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
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
        store.setDelegationTxHash(null);
      }
    }
  });

  const undelegationTxHash = computed<Hex | null>(
    () => store.undelegationTxHash,
  );
  async function undelegate(cb: (txHash: Hex | null) => void): Promise<void> {
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: 'UNDELEGATE',
      data: undefined,
    });
    undelegationCallback.value = cb;
  }
  whenever(undelegationTxHash, (txHash) => {
    if (txHash) {
      if (undelegationCallback.value) {
        undelegationCallback.value(txHash);
        undelegationCallback.value = null;
        store.setUndelegationTxHash(null);
      }
    }
  });

  const providerPersonalSignSignature = computed<Hex | null>(
    () => store.providerPersonalSignSignature,
  );
  async function personalSign(
    message: Hex,
    cb: (signature: Hex | null) => void,
  ): Promise<void> {
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: 'PROVIDER_PERSONAL_SIGN',
      data: {
        message,
      },
    });
    providerPersonalSignCallback.value = cb;
  }
  whenever(providerPersonalSignSignature, (signature) => {
    if (signature) {
      if (providerPersonalSignCallback.value) {
        providerPersonalSignCallback.value(signature);
        providerPersonalSignCallback.value = null;
        store.setProviderPersonalSignSignature(null);
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
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'ALLOW_REQUEST_PERMISSIONS',
      data: undefined,
    });
    store.setIsRequestingPermissions(false);
  }
  function denyRequestPermissions(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: 'DENY_REQUEST_PERMISSIONS',
      data: undefined,
    });
    store.setIsRequestingPermissions(false);
  }

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message: BackendRequestMessage) => {
        if (message.type === 'REQUEST_ACCOUNTS') {
          if (!message.id) {
            return;
          }
          store.setIsRequestingAccounts(true);
          store.setRequestId(message.id);
        }
        if (!message.data) {
          return;
        }
        if (message.type === 'PERSONAL_SIGN') {
          if (!message.id) {
            return;
          }
          store.setIsPersonalSigning(true);
          store.setPersonalSignedMessage(message.data.message);
          store.setRequestId(message.id);
        }
        if (message.type === 'SEND_TRANSACTION') {
          if (!message.id) {
            return;
          }
          store.setIsSendingTransaction(true);
          store.setTransaction(message.data.transaction);
          store.setRequestId(message.id);
        }
        if (message.type === 'DELEGATED') {
          store.setDelegationTxHash(message.data.txHash);
        }
        if (message.type === 'UNDELEGATED') {
          store.setUndelegationTxHash(message.data.txHash);
        }
        if (message.type === 'REQUEST_PERMISSIONS') {
          if (!message.id) {
            return;
          }
          store.setIsRequestingPermissions(true);
          store.setPermissionRequest(message.data.permissionRequest);
          store.setRequestId(message.id);
        }
        if (message.type === 'PROVIDER_PERSONAL_SIGN_RESULT') {
          store.setProviderPersonalSignSignature(message.data.signature);
        }
      });
    });
    const response = (await chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: 'GET_PROVIDER_STATE',
      data: undefined,
    })) as ProviderState;
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
    undelegate,

    isRequestingPermissions,
    permissionRequest,
    allowRequestPermissions,
    denyRequestPermissions,

    personalSign,
  };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
