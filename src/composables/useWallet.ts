import { Address } from 'viem';
import { computed, onMounted, Ref } from 'vue';

import useWalletStore from '@/stores/wallet';

interface UseWallet {
  address: Ref<Address | null>;
  setAddress: (value: Address) => void;
  getMnemonic: () => Promise<string | null>;
  setMnemonic: (value: string) => void;
}

function useWallet(): UseWallet {
  const store = useWalletStore();

  const address = computed(() => store.address);

  function setAddress(value: Address): void {
    store.setAddress(value);
  }

  async function getMnemonic(): Promise<string | null> {
    const response = await chrome.runtime.sendMessage({ type: 'GET_MNEMONIC' });
    return response.mnemonic;
  }

  function setMnemonic(value: string): void {
    chrome.runtime.sendMessage({ type: 'SET_MNEMONIC', data: value });
  }

  onMounted(async () => {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_WALLET_ADDRESS',
    });
    store.setAddress(response.address);
  });

  return { address, setAddress, getMnemonic, setMnemonic };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useWallet };
