import { Account } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { computed, ComputedRef, onMounted, Ref } from 'vue';

import useWalletStore from '@/stores/wallet';

interface UseWallet {
  mnemonic: Ref<string | null>;
  setMnemonic: (value: string) => void;
  account: ComputedRef<Account | null>;
}

function useWallet(): UseWallet {
  const store = useWalletStore();

  const mnemonic = computed(() => store.mnemonic);

  function setMnemonic(value: string): void {
    chrome.runtime.sendMessage({ type: 'SET_MNEMONIC', data: value });
    store.setMnemonic(value);
  }

  const account = computed<Account | null>(() => {
    if (!mnemonic.value) {
      return null;
    }
    return mnemonicToAccount(mnemonic.value);
  });

  onMounted(async () => {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_WALLET_STATE',
    });
    store.setMnemonic(response.mnemonic);
  });

  return { mnemonic, setMnemonic, account };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useWallet };
