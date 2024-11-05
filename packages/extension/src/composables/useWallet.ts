import { Address } from 'viem';
import { computed, onMounted, Ref } from 'vue';

import useWalletStore from '@/stores/wallet';

interface UseWallet {
  address: Ref<Address | null>;
  setAddress: (value: Address) => void;
  getMnemonic: () => Promise<string | null>;
  setMnemonic: (value: string) => Promise<void>;
  removeMnemonic: () => Promise<void>;
}

function useWallet(): UseWallet {
  const store = useWalletStore();

  const address = computed(() => store.address);

  function setAddress(value: Address): void {
    store.setAddress(value);
  }

  async function getMnemonic(): Promise<string | null> {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_WALLET_MNEMONIC',
    });
    return response.mnemonic;
  }

  async function setMnemonic(value: string): Promise<void> {
    await chrome.runtime.sendMessage({
      type: 'SET_WALLET_MNEMONIC',
      data: value,
    });
    await fetchWalletAddress();
  }

  async function removeMnemonic(): Promise<void> {
    await chrome.runtime.sendMessage({
      type: 'SET_WALLET_MNEMONIC',
      data: null,
    });
    await fetchWalletAddress();
  }

  async function fetchWalletAddress(): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_WALLET_ADDRESS',
    });
    store.setAddress(response.address);
  }

  onMounted(() => {
    fetchWalletAddress();
  });

  return { address, setAddress, getMnemonic, setMnemonic, removeMnemonic };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useWallet };
