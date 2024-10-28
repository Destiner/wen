import { defineStore } from 'pinia';
import { Address } from 'viem';
import { ref } from 'vue';

const useWalletStore = defineStore('wallet', () => {
  const address = ref<Address | null>(null);

  function setAddress(value: Address): void {
    address.value = value;
  }

  return { address, setAddress };
});

export default useWalletStore;
