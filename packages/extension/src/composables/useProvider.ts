import { whenever } from '@vueuse/core';
import { Address, Hex, WalletGetCallsStatusReturnType } from 'viem';
import { computed, onMounted, Ref, ref } from 'vue';

import {
  MessageSender,
  PermissionRequest,
  ProviderState,
  SendTransactionRequest,
  TypedDataRequest,
  WalletCallRequest,
} from '@/background/provider';
import {
  BackendRequestMessage,
  FrontendRequestMessage,
  ALLOW_ACCOUNT_REQUEST,
  ALLOW_PERSONAL_SIGN,
  ALLOW_REQUEST_PERMISSIONS,
  ALLOW_SEND_TRANSACTION,
  DENY_ACCOUNT_REQUEST,
  DENY_PERSONAL_SIGN,
  DENY_REQUEST_PERMISSIONS,
  DENY_SEND_TRANSACTION,
  GET_PROVIDER_STATE,
  PERSONAL_SIGN,
  PROVIDER_DELEGATE_RESULT,
  PROVIDER_DELEGATE,
  PROVIDER_PERSONAL_SIGN_RESULT,
  PROVIDER_PERSONAL_SIGN,
  PROVIDER_UNDELEGATE_RESULT,
  PROVIDER_UNDELEGATE,
  REQUEST_ACCOUNTS,
  REQUEST_PERMISSIONS,
  SEND_TRANSACTION,
  ALLOW_SIGN_TYPED_DATA,
  DENY_SIGN_TYPED_DATA,
  SIGN_TYPED_DATA,
  WALLET_SEND_CALLS,
  ALLOW_WALLET_SEND_CALLS,
  DENY_WALLET_SEND_CALLS,
  SHOW_CALLS_STATUS,
} from '@/background/types';
import useProviderStore from '@/stores/provider';
import { promisify } from '@/utils';

import { useToast } from './useToast';

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

  delegate: (args: {
    delegatee: Address;
    data: Hex;
    isSponsored: boolean;
  }) => Promise<Hex | null>;
  undelegate: (isSponsored: boolean) => Promise<Hex | null>;

  isRequestingPermissions: Ref<boolean>;
  permissionRequest: Ref<PermissionRequest | null>;
  allowRequestPermissions: () => void;
  denyRequestPermissions: () => void;

  isSigningTypedData: Ref<boolean>;
  typedDataRequest: Ref<TypedDataRequest | null>;
  allowSignTypedData: () => void;
  denySignTypedData: () => void;

  personalSign: (message: Hex) => Promise<Hex | null>;

  isWalletSendingCalls: Ref<boolean>;
  walletCallRequest: Ref<WalletCallRequest | null>;
  allowWalletSendCalls: () => void;
  denyWalletSendCalls: () => void;

  isShowingCallsStatus: Ref<boolean>;
  walletCallsStatus: Ref<WalletGetCallsStatusReturnType | null>;
  closeCallsStatus: () => void;
}

function useProvider(): UseProvider {
  const store = useProviderStore();
  const { send } = useToast();

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
      type: ALLOW_ACCOUNT_REQUEST,
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
      type: DENY_ACCOUNT_REQUEST,
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
      type: ALLOW_PERSONAL_SIGN,
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
      type: DENY_PERSONAL_SIGN,
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
      type: ALLOW_SEND_TRANSACTION,
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
      type: DENY_SEND_TRANSACTION,
      data: undefined,
    });
    store.setIsSendingTransaction(false);
  }

  const delegationTxHash = computed<Hex | null>(() => store.delegationTxHash);
  async function delegate(
    args: {
      delegatee: Address;
      data: Hex;
      isSponsored: boolean;
    },
    cb: (txHash: Hex | null) => void,
  ): Promise<void> {
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: PROVIDER_DELEGATE,
      data: args,
    });
    delegationCallback.value = cb;
  }
  whenever(delegationTxHash, (txHash) => {
    if (txHash) {
      if (delegationCallback.value) {
        delegationCallback.value(txHash === '0x' ? null : txHash);
        delegationCallback.value = null;
        store.setDelegationTxHash(null);
      }
    }
  });

  const undelegationTxHash = computed<Hex | null>(
    () => store.undelegationTxHash,
  );
  async function undelegate(
    isSponsored: boolean,
    cb: (txHash: Hex | null) => void,
  ): Promise<void> {
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: PROVIDER_UNDELEGATE,
      data: {
        isSponsored,
      },
    });
    undelegationCallback.value = cb;
  }
  whenever(undelegationTxHash, (txHash) => {
    if (txHash) {
      if (undelegationCallback.value) {
        undelegationCallback.value(txHash === '0x' ? null : txHash);
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
      type: PROVIDER_PERSONAL_SIGN,
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
      type: ALLOW_REQUEST_PERMISSIONS,
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
      type: DENY_REQUEST_PERMISSIONS,
      data: undefined,
    });
    store.setIsRequestingPermissions(false);
  }

  const isSigningTypedData = computed<boolean>(() => store.isSigningTypedData);
  const typedDataRequest = computed<TypedDataRequest | null>(
    () => store.typedDataRequest,
  );
  function allowSignTypedData(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: ALLOW_SIGN_TYPED_DATA,
      data: undefined,
    });
    store.setIsSigningTypedData(false);
  }
  function denySignTypedData(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: DENY_SIGN_TYPED_DATA,
      data: undefined,
    });
    store.setIsSigningTypedData(false);
  }

  const isWalletSendingCalls = computed<boolean>(
    () => store.isWalletSendingCalls,
  );
  const walletCallRequest = computed<WalletCallRequest | null>(
    () => store.walletCallRequest,
  );
  function allowWalletSendCalls(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: ALLOW_WALLET_SEND_CALLS,
      data: undefined,
    });
    store.setIsWalletSendingCalls(false);
  }
  function denyWalletSendCalls(): void {
    if (!requestId.value) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId.value,
      type: DENY_WALLET_SEND_CALLS,
      data: undefined,
    });
    store.setIsWalletSendingCalls(false);
  }

  const isShowingCallsStatus = computed<boolean>(
    () => store.isShowingCallsStatus,
  );
  const walletCallsStatus = computed<WalletGetCallsStatusReturnType | null>(
    () => store.walletCallsStatus,
  );
  function closeCallsStatus(): void {
    store.setIsShowingCallsStatus(false);
  }

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message: BackendRequestMessage) => {
        if (message.type === REQUEST_ACCOUNTS) {
          if (!message.id) {
            return;
          }
          store.setIsRequestingAccounts(true);
          store.setRequestId(message.id);
        }
        if (!message.data) {
          return;
        }
        if (message.type === PERSONAL_SIGN) {
          if (!message.id) {
            return;
          }
          store.setIsPersonalSigning(true);
          store.setPersonalSignedMessage(message.data.message);
          store.setRequestId(message.id);
        }
        if (message.type === SEND_TRANSACTION) {
          if (!message.id) {
            return;
          }
          store.setIsSendingTransaction(true);
          store.setTransaction(message.data.transaction);
          store.setRequestId(message.id);
        }
        if (message.type === PROVIDER_DELEGATE_RESULT) {
          if (message.error) {
            const messageText =
              message.error === 'NO_ACCOUNT'
                ? "Can't access account"
                : message.error === 'LOW_FUNDS'
                  ? 'Insufficient funds'
                  : 'Unknown error';
            send({
              type: 'error',
              message: messageText,
            });
            store.setDelegationTxHash('0x');
          } else {
            store.setDelegationTxHash(message.data.txHash);
          }
        }
        if (message.type === PROVIDER_UNDELEGATE_RESULT) {
          if (message.error) {
            const messageText =
              message.error === 'NO_ACCOUNT'
                ? "Can't access account"
                : message.error === 'LOW_FUNDS'
                  ? 'Insufficient funds'
                  : 'Unknown error';
            send({
              type: 'error',
              message: messageText,
            });
            if (undelegationCallback.value) {
              undelegationCallback.value(null);
              undelegationCallback.value = null;
            }
            store.setUndelegationTxHash('0x');
          } else {
            store.setUndelegationTxHash(message.data.txHash);
          }
        }
        if (message.type === REQUEST_PERMISSIONS) {
          if (!message.id) {
            return;
          }
          store.setIsRequestingPermissions(true);
          store.setPermissionRequest(message.data.permissionRequest);
          store.setRequestId(message.id);
        }
        if (message.type === SIGN_TYPED_DATA) {
          if (!message.id) {
            return;
          }
          store.setIsPersonalSigning(true);
          store.setTypedDataRequest(message.data.typedDataRequest);
          store.setRequestId(message.id);
        }
        if (message.type === PROVIDER_PERSONAL_SIGN_RESULT) {
          store.setProviderPersonalSignSignature(message.data.signature);
        }
        if (message.type === WALLET_SEND_CALLS) {
          if (!message.id) {
            return;
          }
          store.setIsWalletSendingCalls(true);
          store.setWalletCallRequest(message.data.walletCallRequest);
          store.setRequestId(message.id);
        }
        if (message.type === SHOW_CALLS_STATUS) {
          store.setIsShowingCallsStatus(true);
          store.setWalletCallsStatus(message.data.callsStatus);
        }
      });
    });
    const response = (await chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: GET_PROVIDER_STATE,
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
    store.setIsSigningTypedData(response.isSigningTypedData);
    store.setTypedDataRequest(response.typedDataRequest);
    store.setIsWalletSendingCalls(response.isWalletSendingCalls);
    store.setWalletCallRequest(response.walletCallRequest);
    store.setIsShowingCallsStatus(response.isShowingCallsStatus);
    store.setWalletCallsStatus(response.walletCallsStatus);
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

    delegate: promisify(delegate),
    undelegate: promisify(undelegate),

    isRequestingPermissions,
    permissionRequest,
    allowRequestPermissions,
    denyRequestPermissions,

    isSigningTypedData,
    typedDataRequest,
    allowSignTypedData,
    denySignTypedData,

    personalSign: promisify(personalSign),

    isWalletSendingCalls,
    walletCallRequest,
    allowWalletSendCalls,
    denyWalletSendCalls,

    isShowingCallsStatus,
    walletCallsStatus,
    closeCallsStatus,
  };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
