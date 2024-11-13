import { whenever } from '@vueuse/core';
import { Address, Hex, WalletGetCallsStatusReturnType } from 'viem';
import { computed, onMounted, Ref, ref } from 'vue';

import {
  MessageSender,
  PermissionRequestData,
  ProviderRequest,
  ProviderState,
  SendTransactionRequestData,
  TypedDataRequestData,
  WalletCallRequestData,
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
  // PERSONAL_SIGN,
  PROVIDER_DELEGATE_RESULT,
  PROVIDER_DELEGATE,
  PROVIDER_PERSONAL_SIGN_RESULT,
  PROVIDER_PERSONAL_SIGN,
  PROVIDER_UNDELEGATE_RESULT,
  PROVIDER_UNDELEGATE,
  // REQUEST_ACCOUNTS,
  // REQUEST_PERMISSIONS,
  // SEND_TRANSACTION,
  ALLOW_SIGN_TYPED_DATA,
  DENY_SIGN_TYPED_DATA,
  // SIGN_TYPED_DATA,
  // WALLET_SEND_CALLS,
  ALLOW_WALLET_SEND_CALLS,
  DENY_WALLET_SEND_CALLS,
  // SHOW_CALLS_STATUS,
  HIDE_CALLS_STATUS,
  REQUEST_ACCOUNTS,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  WALLET_SEND_CALLS,
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
  transaction: Ref<SendTransactionRequestData | null>;
  allowSendTransaction: () => void;
  denySendTransaction: () => void;

  isRequestingPermissions: Ref<boolean>;
  permissionRequest: Ref<PermissionRequestData | null>;
  allowRequestPermissions: () => void;
  denyRequestPermissions: () => void;

  isSigningTypedData: Ref<boolean>;
  typedDataRequest: Ref<TypedDataRequestData | null>;
  allowSignTypedData: () => void;
  denySignTypedData: () => void;

  isWalletSendingCalls: Ref<boolean>;
  walletCallRequest: Ref<WalletCallRequestData | null>;
  allowWalletSendCalls: () => void;
  denyWalletSendCalls: () => void;

  isShowingCallsStatus: Ref<boolean>;
  walletCallsStatus: Ref<WalletGetCallsStatusReturnType | null>;
  hideCallsStatus: () => void;

  personalSign: (message: Hex) => Promise<Hex | null>;
  delegate: (args: {
    delegatee: Address;
    data: Hex;
    isSponsored: boolean;
  }) => Promise<Hex | null>;
  undelegate: (isSponsored: boolean) => Promise<Hex | null>;
}

function useProvider(): UseProvider {
  const store = useProviderStore();
  const { send } = useToast();

  const activeRequest = computed<ProviderRequest | null>(
    () => store.activeRequest,
  );
  const requestSender = computed<MessageSender | null>(() =>
    activeRequest.value ? activeRequest.value.sender : null,
  );

  const delegationCallback = ref<((txHash: Hex | null) => void) | null>(null);
  const undelegationCallback = ref<((txHash: Hex | null) => void) | null>(null);
  const providerPersonalSignCallback = ref<
    ((signature: Hex | null) => void) | null
  >(null);

  const isRequestingAccounts = computed<boolean>(() =>
    store.activeRequest ? store.activeRequest.type === 'account' : false,
  );
  function allowAccountRequest(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_ACCOUNT_REQUEST,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denyAccountRequest(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_ACCOUNT_REQUEST,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isPersonalSigning = computed<boolean>(() =>
    store.activeRequest ? store.activeRequest.type === 'personal_sign' : false,
  );
  const personalSignedMessage = computed<Hex | null>(() =>
    store.activeRequest && store.activeRequest.type === 'personal_sign'
      ? store.activeRequest.message
      : null,
  );
  function allowPersonalSign(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_PERSONAL_SIGN,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denyPersonalSign(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_PERSONAL_SIGN,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isSendingTransaction = computed<boolean>(() =>
    store.activeRequest
      ? store.activeRequest.type === 'send_transaction'
      : false,
  );
  const transaction = computed<SendTransactionRequestData | null>(() =>
    store.activeRequest && store.activeRequest.type === 'send_transaction'
      ? store.activeRequest.transaction
      : null,
  );
  function allowSendTransaction(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_SEND_TRANSACTION,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denySendTransaction(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_SEND_TRANSACTION,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isRequestingPermissions = computed<boolean>(() =>
    store.activeRequest
      ? store.activeRequest.type === 'request_permissions'
      : false,
  );
  const permissionRequest = computed<PermissionRequestData | null>(() =>
    store.activeRequest && store.activeRequest.type === 'request_permissions'
      ? store.activeRequest.permissionRequest
      : null,
  );
  function allowRequestPermissions(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_REQUEST_PERMISSIONS,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denyRequestPermissions(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_REQUEST_PERMISSIONS,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isSigningTypedData = computed<boolean>(() =>
    store.activeRequest
      ? store.activeRequest.type === 'sign_typed_data'
      : false,
  );
  const typedDataRequest = computed<TypedDataRequestData | null>(() =>
    store.activeRequest && store.activeRequest.type === 'sign_typed_data'
      ? store.activeRequest.typedDataRequest
      : null,
  );
  function allowSignTypedData(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_SIGN_TYPED_DATA,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denySignTypedData(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_SIGN_TYPED_DATA,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isWalletSendingCalls = computed<boolean>(() =>
    store.activeRequest
      ? store.activeRequest.type === 'wallet_send_calls'
      : false,
  );
  const walletCallRequest = computed<WalletCallRequestData | null>(() =>
    store.activeRequest && store.activeRequest.type === 'wallet_send_calls'
      ? store.activeRequest.walletCallRequest
      : null,
  );
  function allowWalletSendCalls(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: ALLOW_WALLET_SEND_CALLS,
      data: undefined,
    });
    store.setActiveRequest(null);
  }
  function denyWalletSendCalls(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: DENY_WALLET_SEND_CALLS,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const isShowingCallsStatus = computed<boolean>(() =>
    store.activeRequest
      ? store.activeRequest.type === 'show_calls_status'
      : false,
  );
  const walletCallsStatus = computed<WalletGetCallsStatusReturnType | null>(
    () =>
      store.activeRequest && store.activeRequest.type === 'show_calls_status'
        ? store.activeRequest.walletCallStatus
        : null,
  );
  function hideCallsStatus(): void {
    const requestId = getRequestId();
    if (!requestId) {
      return;
    }
    chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: requestId,
      type: HIDE_CALLS_STATUS,
      data: undefined,
    });
    store.setActiveRequest(null);
  }

  const personalSignSignature = computed<Hex | null>(
    () => store.personalSignSignature,
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
  whenever(personalSignSignature, (signature) => {
    if (signature) {
      if (providerPersonalSignCallback.value) {
        providerPersonalSignCallback.value(signature);
        providerPersonalSignCallback.value = null;
        store.setActiveRequest(null);
      }
    }
  });

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

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message: BackendRequestMessage) => {
        if (message.type === REQUEST_ACCOUNTS) {
          store.setActiveRequest({
            id: message.id,
            sender: message.sender,
            type: 'account',
          });
        }
        if (!message.data) {
          return;
        }
        if (message.type === PERSONAL_SIGN) {
          if (!message.id) {
            return;
          }
          store.setActiveRequest({
            id: message.id,
            sender: message.sender,
            type: 'personal_sign',
            message: message.data.message,
          });
        }
        if (message.type === SEND_TRANSACTION) {
          if (!message.id) {
            return;
          }
          store.setActiveRequest({
            id: message.id,
            sender: message.sender,
            type: 'send_transaction',
            transaction: message.data.transaction,
          });
        }
        if (message.type === WALLET_SEND_CALLS) {
          if (!message.id) {
            return;
          }
          store.setActiveRequest({
            id: message.id,
            sender: message.sender,
            type: 'wallet_send_calls',
            walletCallRequest: message.data.walletCallRequest,
          });
        }
        if (message.type === SHOW_CALLS_STATUS) {
          if (!message.id) {
            return;
          }
          store.setActiveRequest({
            id: message.id,
            sender: message.sender,
            type: 'show_calls_status',
            walletCallStatus: message.data.callsStatus,
          });
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
            store.setDelegationTxHash(message.data?.txHash || null);
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
            store.setUndelegationTxHash(message.data?.txHash || null);
          }
        }
        if (message.type === PROVIDER_PERSONAL_SIGN_RESULT) {
          store.setPersonalSignSignature(message.data?.signature || null);
        }
      });
    });
    const response = (await chrome.runtime.sendMessage<FrontendRequestMessage>({
      id: Math.random(),
      type: GET_PROVIDER_STATE,
      data: undefined,
    })) as ProviderState;
    store.setActiveRequest(response.activeRequest);
  });

  function getRequestId(): string | number | null {
    if (activeRequest.value) {
      return activeRequest.value.id;
    }
    return null;
  }

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
    hideCallsStatus,
  };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
