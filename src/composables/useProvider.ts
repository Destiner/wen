import { Hex } from 'viem';
import { onMounted, Ref, ref } from 'vue';

import { useWallet } from './useWallet';

interface UseProvider {
  isRequestingAccounts: Ref<boolean>;
  allowAccountRequest: () => void;
  denyAccountRequest: () => void;

  isPersonalSigning: Ref<boolean>;
  personalSignedMessage: Ref<Hex | null>;
  allowPersonalSign: () => void;
  denyPersonalSign: () => void;
}

function useProvider(): UseProvider {
  const wallet = useWallet();

  const accountRequestId = ref<string | number>('');

  const isRequestingAccounts = ref(false);
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

  const isPersonalSigning = ref(false);
  const personalSignedMessage = ref<Hex | null>(null);
  function allowPersonalSign(): void {
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'ALLOW_PERSONAL_SIGN',
      data: personalSignedMessage.value,
    });
    isPersonalSigning.value = false;
  }
  function denyPersonalSign(): void {
    chrome.runtime.sendMessage({
      id: accountRequestId.value,
      type: 'DENY_PERSONAL_SIGN',
    });
    isPersonalSigning.value = false;
  }

  onMounted(async () => {
    document.addEventListener('DOMContentLoaded', () => {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'REQUEST_ACCOUNTS') {
          isRequestingAccounts.value = true;
          accountRequestId.value = message.id;
        }
        if (message.type === 'PERSONAL_SIGN') {
          isPersonalSigning.value = true;
          personalSignedMessage.value = message.data;
          accountRequestId.value = message.id;
        }
      });
    });
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PROVIDER_STATE',
    });
    accountRequestId.value = response.accountRequestId;
    isRequestingAccounts.value = response.isRequestingAccounts;
    isPersonalSigning.value = response.isPersonalSigning;
    personalSignedMessage.value = response.personalSignedMessage;
  });

  return {
    isRequestingAccounts,
    allowAccountRequest,
    denyAccountRequest,
    isPersonalSigning,
    personalSignedMessage,
    allowPersonalSign,
    denyPersonalSign,
  };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useProvider };
