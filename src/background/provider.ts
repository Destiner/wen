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
  allowedAccounts: Address[];
  isRequestingAccounts: boolean;
  accountRequestId: string | number | null;
}

interface WalletState {
  mnemonic: string | null;
}

const storage = new Storage();

const providerState: ProviderState = {
  allowedAccounts: [],
  isRequestingAccounts: false,
  accountRequestId: null,
};

const walletState: WalletState = {
  mnemonic: null,
};

const callbacks: Record<
  string | number,
  (value: AccountRequestResponse) => void
> = {};

init();

async function init(): Promise<void> {
  await storage.init();
  const data = await storage.getProviderData();
  walletState.mnemonic = data.mnemonic;
}

async function getAccounts(): Promise<Address[]> {
  return providerState.allowedAccounts;
}

async function requestAccounts(
  id: string | number,
  callback: (value: AccountRequestResponse) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isRequestingAccounts = true;
  providerState.accountRequestId = id;
  chrome.runtime.sendMessage({
    type: 'REQUEST_ACCOUNTS',
    id,
  });
}

function allowConnection(id: string | number, addresses: Address[]): void {
  providerState.isRequestingAccounts = false;
  providerState.allowedAccounts = addresses;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: addresses,
    });
  }
}

function denyConnection(id: string | number): void {
  providerState.isRequestingAccounts = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied connection request'),
    });
  }
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === 'ALLOW_CONNECTION') {
    allowConnection(request.id, getAddresses());
  } else if (request.type === 'DENY_CONNECTION') {
    denyConnection(request.id);
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

export { getAccounts, requestAccounts };
