import { defineStore } from 'pinia';
import { Hex } from 'viem';
import { ref } from 'vue';

import {
  MessageSender,
  PermissionRequest,
  SendTransactionRequest,
} from '@/background/provider';

const useProviderStore = defineStore('provider', () => {
  const requestId = ref<string | number | null>(null);
  const requestSender = ref<MessageSender | null>(null);
  const isRequestingAccounts = ref<boolean>(false);
  const isPersonalSigning = ref<boolean>(false);
  const personalSignedMessage = ref<Hex | null>(null);
  const isSendingTransaction = ref<boolean>(false);
  const transaction = ref<SendTransactionRequest | null>(null);
  const delegationTxHash = ref<Hex | null>(null);
  const undelegationTxHash = ref<Hex | null>(null);
  const providerPersonalSignSignature = ref<Hex | null>(null);
  const isRequestingPermissions = ref<boolean>(false);
  const permissionRequest = ref<PermissionRequest | null>(null);

  function setRequestId(value: string | number | null): void {
    requestId.value = value;
  }

  function setRequestSender(value: MessageSender | null): void {
    requestSender.value = value;
  }

  function setIsRequestingAccounts(value: boolean): void {
    isRequestingAccounts.value = value;
  }

  function setIsPersonalSigning(value: boolean): void {
    isPersonalSigning.value = value;
  }

  function setPersonalSignedMessage(value: Hex | null): void {
    personalSignedMessage.value = value;
  }

  function setIsSendingTransaction(value: boolean): void {
    isSendingTransaction.value = value;
  }

  function setTransaction(value: SendTransactionRequest | null): void {
    transaction.value = value;
  }

  function setDelegationTxHash(value: Hex | null): void {
    delegationTxHash.value = value;
  }

  function setUndelegationTxHash(value: Hex | null): void {
    undelegationTxHash.value = value;
  }

  function setProviderPersonalSignSignature(value: Hex | null): void {
    providerPersonalSignSignature.value = value;
  }

  function setIsRequestingPermissions(value: boolean): void {
    isRequestingPermissions.value = value;
  }

  function setPermissionRequest(value: PermissionRequest | null): void {
    permissionRequest.value = value;
  }

  return {
    requestId,
    requestSender,
    isRequestingAccounts,
    isPersonalSigning,
    personalSignedMessage,
    isSendingTransaction,
    transaction,
    delegationTxHash,
    undelegationTxHash,
    providerPersonalSignSignature,
    isRequestingPermissions,
    permissionRequest,
    setRequestId,
    setRequestSender,
    setIsRequestingAccounts,
    setIsPersonalSigning,
    setPersonalSignedMessage,
    setIsSendingTransaction,
    setTransaction,
    setDelegationTxHash,
    setUndelegationTxHash,
    setProviderPersonalSignSignature,
    setIsRequestingPermissions,
    setPermissionRequest,
  };
});

export default useProviderStore;
