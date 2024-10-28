import { defineStore } from 'pinia';
import { Hex, Transaction } from 'viem';
import { ref } from 'vue';

const useProviderStore = defineStore('provider', () => {
  const accountRequestId = ref<string | number>('');
  const isRequestingAccounts = ref<boolean>(false);
  const isPersonalSigning = ref<boolean>(false);
  const personalSignedMessage = ref<Hex | null>(null);
  const isSendingTransaction = ref<boolean>(false);
  const transaction = ref<Transaction | null>(null);
  const delegationTxHash = ref<Hex | null>(null);

  function setAccountRequestId(value: string | number): void {
    accountRequestId.value = value;
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

  function setTransaction(value: Transaction | null): void {
    transaction.value = value;
  }

  function setDelegationTxHash(value: Hex | null): void {
    delegationTxHash.value = value;
  }

  return {
    accountRequestId,
    isRequestingAccounts,
    isPersonalSigning,
    personalSignedMessage,
    isSendingTransaction,
    transaction,
    delegationTxHash,
    setAccountRequestId,
    setIsRequestingAccounts,
    setIsPersonalSigning,
    setPersonalSignedMessage,
    setIsSendingTransaction,
    setTransaction,
    setDelegationTxHash,
  };
});

export default useProviderStore;
