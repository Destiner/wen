import { Address, Hex } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { odysseyTestnet } from 'viem/chains';

import { Storage } from './storage';

type Response<T> =
  | {
      status: true;
      result: T;
    }
  | {
      status: false;
      error: Error;
    };

type AccountRequestResponse = Response<Address[]>;
type PersonalSignResponse = Response<Hex>;

interface ProviderState {
  accountRequestId: string | number | null;

  allowedAccounts: Address[];
  isRequestingAccounts: boolean;

  isPersonalSigning: boolean;
  personalSignedMessage: Hex | null;
}

interface WalletState {
  mnemonic: string | null;
}

const storage = new Storage();

const providerState: ProviderState = {
  accountRequestId: null,

  isRequestingAccounts: false,
  allowedAccounts: [],

  isPersonalSigning: false,
  personalSignedMessage: null,
};

const walletState: WalletState = {
  mnemonic: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callbacks: Record<string | number, (value: Response<any>) => void> = {};

init();

async function init(): Promise<void> {
  await storage.init();
  const data = await storage.getProviderData();
  walletState.mnemonic = data.mnemonic;
}

function getChainId(): number {
  return odysseyTestnet.id;
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

async function personalSign(
  id: string | number,
  message: Hex,
  address: Address,
  callback: (value: PersonalSignResponse) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isPersonalSigning = true;
  providerState.personalSignedMessage = message;
  providerState.accountRequestId = id;
  chrome.runtime.sendMessage({
    type: 'PERSONAL_SIGN',
    id,
  });
}

function allowAccountRequest(id: string | number, addresses: Address[]): void {
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

function denyAccountRequest(id: string | number): void {
  providerState.isRequestingAccounts = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied connection request'),
    });
  }
}

async function allowPersonalSign(id: string | number): Promise<void> {
  if (!providerState.personalSignedMessage) {
    return;
  }
  const signature = await getPersonalSignature(
    providerState.personalSignedMessage,
  );
  providerState.isPersonalSigning = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: signature,
    });
  }
}

function denyPersonalSign(id: string | number): void {
  providerState.isPersonalSigning = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied personal sign request'),
    });
  }
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === 'ALLOW_ACCOUNT_REQUEST') {
    allowAccountRequest(request.id, getAddresses());
  } else if (request.type === 'DENY_ACCOUNT_REQUEST') {
    denyAccountRequest(request.id);
  } else if (request.type === 'ALLOW_PERSONAL_SIGN') {
    allowPersonalSign(request.id);
  } else if (request.type === 'DENY_PERSONAL_SIGN') {
    denyPersonalSign(request.id);
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

async function getPersonalSignature(message: Hex): Promise<Hex | null> {
  if (!walletState.mnemonic) {
    return null;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  return await account.signMessage({
    message: {
      raw: message,
    },
  });
}

export { getChainId, getAccounts, requestAccounts, personalSign };
