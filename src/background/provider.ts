import { v4 as uuidv4 } from '@lukeed/uuid';
import {
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  WalletPermission,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { odysseyTestnet } from 'viem/chains';
import { eip7702Actions } from 'viem/experimental';

import { Storage } from './storage';

interface SendTransactionRequest {
  to: Hex;
  from: Hex;
  gas?: Hex;
  value?: Hex;
  data: Hex;
  gasPrice?: Hex;
  maxPriorityFeePerGas?: Hex;
  maxFeePerGas?: Hex;
  nonce?: Hex;
}

interface PermissionRequest {
  [methodName: string]: {
    [caveatName: string]: unknown;
  };
}

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

  isSendingTransaction: boolean;
  transaction: SendTransactionRequest | null;

  isRequestingPermissions: boolean;
  permissionRequest: PermissionRequest | null;
  permissions: WalletPermission[];
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

  isSendingTransaction: false,
  transaction: null,

  isRequestingPermissions: false,
  permissionRequest: null,
  permissions: [],
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

async function sendTransaction(
  id: string | number,
  transaction: SendTransactionRequest,
  callback: (value: Response<Hex>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isSendingTransaction = true;
  providerState.transaction = transaction;
  providerState.accountRequestId = id;
  chrome.runtime.sendMessage({
    type: 'SEND_TRANSACTION',
    id,
  });
}

async function getPermissions(): Promise<WalletPermission[]> {
  return providerState.permissions;
}

async function requestPermissions(
  id: string | number,
  permissionRequest: PermissionRequest,
  callback: (value: Response<PermissionRequest>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isRequestingPermissions = true;
  providerState.permissionRequest = permissionRequest;
  providerState.accountRequestId = id;
  chrome.runtime.sendMessage({
    type: 'REQUEST_PERMISSIONS',
    id,
  });
}

async function revokePermissions(
  permissionRequest: PermissionRequest,
): Promise<void> {
  if (Object.keys(permissionRequest).includes('eth_accounts')) {
    providerState.allowedAccounts = [];
  }
  providerState.permissions = providerState.permissions.filter((permission) => {
    return !Object.keys(permissionRequest).includes(
      permission.parentCapability,
    );
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
  providerState.isPersonalSigning = false;
  if (!providerState.personalSignedMessage) {
    return;
  }
  const signature = await getPersonalSignature(
    providerState.personalSignedMessage,
  );
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

async function allowSendTransaction(id: string | number): Promise<void> {
  providerState.isSendingTransaction = false;
  if (!providerState.transaction) {
    return;
  }
  const txHash = await submitTransaction(providerState.transaction);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: txHash,
    });
  }
}

function denySendTransaction(id: string | number): void {
  providerState.isSendingTransaction = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied transaction request'),
    });
  }
}

async function allowRequestPermissions(id: string | number): Promise<void> {
  providerState.isRequestingPermissions = false;
  if (!providerState.permissionRequest) {
    return;
  }
  if (Object.keys(providerState.permissionRequest).includes('eth_accounts')) {
    providerState.allowedAccounts = getAddresses();
  }
  const walletPermissions: WalletPermission[] = Object.keys(
    providerState.permissionRequest,
  ).map((permissionName) => {
    return {
      id: uuidv4(),
      parentCapability: permissionName,
      // TODO
      invoker: 'https://',
      caveats: [
        {
          type: 'restrictReturnedAccounts',
          value: getAddresses(),
        },
      ],
      date: Date.now(),
    };
  });
  providerState.permissions = walletPermissions;
  providerState.permissionRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: walletPermissions,
    });
  }
}

function denyRequestPermissions(id: string | number): void {
  providerState.isRequestingPermissions = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied permission request'),
    });
  }
}

async function delegate(delegatee: Address, data: Hex): Promise<void> {
  if (!walletState.mnemonic) {
    chrome.runtime.sendMessage({
      type: 'DELEGATED',
      data: {
        txHash: null,
      },
    });
    return;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  const walletClient = createWalletClient({
    account,
    chain: odysseyTestnet,
    transport: http(),
  }).extend(eip7702Actions());

  const authorization = await walletClient.signAuthorization({
    contractAddress: delegatee,
  });
  const txHash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data,
    to: walletClient.account.address,
  });

  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  chrome.runtime.sendMessage({
    type: 'DELEGATED',
    data: {
      txHash,
    },
  });
}

function getWalletAddress(): Address | null {
  if (!walletState.mnemonic) {
    return null;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  return account.address;
}

chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  if (request.type === 'ALLOW_ACCOUNT_REQUEST') {
    allowAccountRequest(request.id, getAddresses());
  } else if (request.type === 'DENY_ACCOUNT_REQUEST') {
    denyAccountRequest(request.id);
  } else if (request.type === 'ALLOW_PERSONAL_SIGN') {
    allowPersonalSign(request.id);
  } else if (request.type === 'DENY_PERSONAL_SIGN') {
    denyPersonalSign(request.id);
  } else if (request.type === 'ALLOW_SEND_TRANSACTION') {
    allowSendTransaction(request.id);
  } else if (request.type === 'DENY_SEND_TRANSACTION') {
    denySendTransaction(request.id);
  } else if (request.type === 'ALLOW_REQUEST_PERMISSIONS') {
    allowRequestPermissions(request.id);
  } else if (request.type === 'DENY_REQUEST_PERMISSIONS') {
    denyRequestPermissions(request.id);
  } else if (request.type === 'DELEGATE') {
    const delegatee = request.data.delegatee;
    const data = request.data.data;
    await delegate(delegatee, data);
  } else if (request.type === 'GET_PROVIDER_STATE') {
    sendResponse(providerState);
  } else if (request.type === 'GET_WALLET_ADDRESS') {
    const address = getWalletAddress();
    sendResponse({
      address,
    });
  } else if (request.type === 'GET_WALLET_MNEMONIC') {
    sendResponse({
      mnemonic: walletState.mnemonic,
    });
  } else if (request.type === 'SET_WALLET_MNEMONIC') {
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

async function submitTransaction(
  transaction: SendTransactionRequest,
): Promise<Hex | null> {
  if (!walletState.mnemonic) {
    return null;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  const walletClient = createWalletClient({
    account,
    chain: odysseyTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const value = BigInt(transaction.value || '0x0');

  // Estimate gas price if not provided
  let maxFeePerGas = BigInt(transaction.gasPrice || '0x0');
  let maxPriorityFeePerGas = BigInt(transaction.gasPrice || '0x0');
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    const feeValues = await publicClient.estimateFeesPerGas();
    maxFeePerGas = feeValues.maxFeePerGas;
    maxPriorityFeePerGas = feeValues.maxPriorityFeePerGas;
  }

  // Estimate gas limit if not provided
  let gas = BigInt(transaction.gas || '0x0');
  if (!gas) {
    const gasLimit = await publicClient.estimateGas({
      account: walletClient.account.address,
      to: transaction.to,
      data: transaction.data,
      value,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    gas = gasLimit;
  }

  return await walletClient.sendTransaction({
    chain: odysseyTestnet,
    to: transaction.to,
    data: transaction.data,
    value,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
}

export {
  getChainId,
  getAccounts,
  requestAccounts,
  personalSign,
  sendTransaction,
  getPermissions,
  requestPermissions,
  revokePermissions,
};
export type { SendTransactionRequest, PermissionRequest };
