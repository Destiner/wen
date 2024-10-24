import { onMounted, Ref, ref } from 'vue';

import { useWallet } from './useWallet';

interface UseProvider {
  isRequestingAccounts: Ref<boolean>;
  allowAccountRequest: () => void;
  denyAccountRequest: () => void;
}

function useProvider(): UseProvider {
  const wallet = useWallet();

  const isRequestingAccounts = ref(false);
  const accountRequestId = ref<string | number>('');

  function allowAccountRequest(): void {
    const addresses = wallet.account.value
      ? [wallet.account.value.address]
      : [];
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'ALLOW_ACCOUNT_REQUEST',
      data: addresses,
    });
    isRequestingAccounts.value = false;
  }

  function denyAccountRequest(): void {
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'DENY_ACCOUNT_REQUEST',
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

  return { isRequestingAccounts, allowAccountRequest, denyAccountRequest };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
