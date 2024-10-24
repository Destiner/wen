import { Address } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

import { Storage } from './storage';

type AccountRequestResponse =
  | {
      status: true;
      result: Address[];
    }
  | {
      status: false;
      error: Error;
    };

interface ProviderState {
  isRequestingAccounts: boolean;
}

interface WalletState {
  mnemonic: string | null;
}

const storage = new Storage();

const providerState: ProviderState = {
  isRequestingAccounts: false,
};

const walletState: WalletState = {
  mnemonic: null,
};

let lastCallback: (value: AccountRequestResponse) => void;

init();

async function init(): Promise<void> {
  await storage.init();
  const data = await storage.getProviderData();
  walletState.mnemonic = data.mnemonic;
}

async function request(
  id: string | number | null,
  callback: (value: AccountRequestResponse) => void,
): Promise<void> {
  lastCallback = callback;
  providerState.isRequestingAccounts = true;
  chrome.runtime.sendMessage({
    type: 'REQUEST_ACCOUNTS',
  });
}

function allowConnection(addresses: Address[]): void {
  providerState.isRequestingAccounts = false;
  lastCallback({
    status: true,
    result: addresses,
  });
}

function denyConnection(): void {
  providerState.isRequestingAccounts = false;
  lastCallback({
    status: false,
    error: new Error('User denied connection request'),
  });
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === 'ALLOW_CONNECTION') {
    allowConnection(getAddresses());
  } else if (request.type === 'DENY_CONNECTION') {
    denyConnection();
  } else if (request.type === 'GET_PROVIDER_STATE') {
    sendResponse(providerState);
  } else if (request.type === 'GET_WALLET_STATE') {
    sendResponse(walletState);
  } else if (request.type === 'SET_MNEMONIC') {
    walletState.mnemonic = request.data;
    storage.setProviderData({ mnemonic: request.data });
  }
});

function getAddresses(): Address[] {
  if (!walletState.mnemonic) {
    return [];
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  return [account.address];
}

// eslint-disable-next-line import-x/prefer-default-export
export { request };
