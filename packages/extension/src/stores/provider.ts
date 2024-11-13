import { defineStore } from 'pinia';
import { Hex } from 'viem';
import { ref } from 'vue';

import { ProviderRequest } from '@/background/provider';

const useProviderStore = defineStore('provider', () => {
  const activeRequest = ref<ProviderRequest | null>(null);
  const delegationTxHash = ref<Hex | null>(null);
  const undelegationTxHash = ref<Hex | null>(null);
  const personalSignSignature = ref<Hex | null>(null);

  function setActiveRequest(value: ProviderRequest | null): void {
    activeRequest.value = value;
  }

  function setDelegationTxHash(value: Hex | null): void {
    delegationTxHash.value = value;
  }

  function setUndelegationTxHash(value: Hex | null): void {
    undelegationTxHash.value = value;
  }

  function setPersonalSignSignature(value: Hex | null): void {
    personalSignSignature.value = value;
  }

  return {
    activeRequest,
    setActiveRequest,
    delegationTxHash,
    setDelegationTxHash,
    undelegationTxHash,
    setUndelegationTxHash,
    personalSignSignature,
    setPersonalSignSignature,
  };
});

export default useProviderStore;
