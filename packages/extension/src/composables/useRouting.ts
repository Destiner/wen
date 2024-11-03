import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useProvider } from './useProvider';
import { useWallet } from './useWallet';

function useRouting(): void {
  const router = useRouter();
  const provider = useProvider();
  const wallet = useWallet();

  const hasWalletAddress = computed(() => !!wallet.address.value);
  const isProviderRequestingAccount = computed(
    () => provider.isRequestingAccounts.value,
  );
  const isProviderPersonalSigning = computed(
    () => provider.isPersonalSigning.value,
  );
  const isProviderSendingTransaction = computed(
    () => provider.isSendingTransaction.value,
  );
  const isProviderRequestingPermissions = computed(
    () => provider.isRequestingPermissions.value,
  );

  watch(isProviderRequestingAccount, (value) => {
    if (!hasWalletAddress.value) {
      return;
    }
    if (value) {
      router.push({ name: 'account-request' });
    } else {
      router.push({ name: 'home' });
    }
  });

  watch(isProviderPersonalSigning, (value) => {
    if (!hasWalletAddress.value) {
      return;
    }
    if (value) {
      router.push({ name: 'personal-sign' });
    } else {
      router.push({ name: 'home' });
    }
  });

  watch(isProviderSendingTransaction, (value) => {
    if (!hasWalletAddress.value) {
      return;
    }
    if (value) {
      router.push({ name: 'send-transaction' });
    } else {
      router.push({ name: 'home' });
    }
  });

  watch(isProviderRequestingPermissions, (value) => {
    if (!hasWalletAddress.value) {
      return;
    }
    if (value) {
      router.push({ name: 'request-permissions' });
    } else {
      router.push({ name: 'home' });
    }
  });

  watch(
    hasWalletAddress,
    (value) => {
      if (!value) {
        router.push({ name: 'import' });
        return;
      }
      if (isProviderPersonalSigning.value) {
        router.push({ name: 'personal-sign' });
        return;
      }
      if (isProviderRequestingAccount.value) {
        router.push({ name: 'account-request' });
        return;
      }
      if (isProviderSendingTransaction.value) {
        router.push({ name: 'send-transaction' });
        return;
      }
      if (isProviderRequestingPermissions.value) {
        router.push({ name: 'request-permissions' });
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
