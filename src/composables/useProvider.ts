import { onMounted, Ref, ref } from 'vue';

import { useWallet } from './useWallet';

interface UseProvider {
  isRequestingAccounts: Ref<boolean>;
  allow: () => void;
  deny: () => void;
}

function useProvider(): UseProvider {
  const wallet = useWallet();

  const isRequestingAccounts = ref(false);
  const accountRequestId = ref<string | number>('');

  function allow(): void {
    const addresses = wallet.account.value
      ? [wallet.account.value.address]
      : [];
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'ALLOW_CONNECTION',
      data: addresses,
    });
    isRequestingAccounts.value = false;
  }

  function deny(): void {
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'DENY_CONNECTION',
    });
    isRequestingAccounts.value = false;
  }

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'REQUEST_ACCOUNTS') {
          isRequestingAccounts.value = true;
          accountRequestId.value = message.id;
        }
      });
    });
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PROVIDER_STATE',
    });
    isRequestingAccounts.value = response.isRequestingAccounts;
    accountRequestId.value = response.accountRequestId;
  });

  return { isRequestingAccounts, allow, deny };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
