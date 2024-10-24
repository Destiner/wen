import { defineStore } from 'pinia';
import { ref } from 'vue';

const useWalletStore = defineStore('wallet', () => {
  const mnemonic = ref<string | null>(null);

  function setMnemonic(value: string): void {
    mnemonic.value = value;
  }

  return { mnemonic, setMnemonic };
});

export default useWalletStore;
