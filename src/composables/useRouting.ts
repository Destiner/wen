import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useProvider } from './useProvider';
import { useWallet } from './useWallet';

function useRouting(): void {
  const router = useRouter();
  const provider = useProvider();
  const wallet = useWallet();

  const hasWalletMnemonic = computed(() => !!wallet.mnemonic.value);
  const isProviderRequestingAccount = computed(
    () => provider.isRequestingAccounts.value,
  );

  watch(isProviderRequestingAccount, (value) => {
    if (!hasWalletMnemonic.value) {
      return;
    }
    if (value) {
      router.push({ name: 'account-request' });
    } else {
      router.push({ name: 'home' });
    }
  });

  watch(
    hasWalletMnemonic,
    (value) => {
      if (!value) {
        router.push({ name: 'import' });
        return;
      }
      if (isProviderRequestingAccount.value) {
        router.push({ name: 'account-request' });
        return;
      }
      router.push({ name: 'home' });
    },
    {
      immediate: true,
    },
  );
}

// eslint-disable-next-line import-x/prefer-default-export
export { useRouting };
