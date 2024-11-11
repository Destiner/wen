import { v4 as uuidv4 } from '@lukeed/uuid';
import {
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  SendTransactionErrorType,
  TypedData,
  TypedDataDefinition,
  TypedDataDomain,
  WalletPermission,
  zeroAddress,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { odysseyTestnet } from 'viem/chains';
import { eip7702Actions } from 'viem/experimental';

import { Storage } from './storage';
import {
  FrontendRequestMessage,
  BackendRequestMessage,
  ALLOW_ACCOUNT_REQUEST,
  ALLOW_PERSONAL_SIGN,
  ALLOW_REQUEST_PERMISSIONS,
  ALLOW_SEND_TRANSACTION,
  DENY_ACCOUNT_REQUEST,
  DENY_PERSONAL_SIGN,
  DENY_REQUEST_PERMISSIONS,
  DENY_SEND_TRANSACTION,
  GET_PROVIDER_STATE,
  GET_WALLET_ADDRESS,
  GET_WALLET_MNEMONIC,
  PERSONAL_SIGN,
  PROVIDER_DELEGATE_RESULT,
  PROVIDER_DELEGATE,
  PROVIDER_PERSONAL_SIGN_RESULT,
  PROVIDER_PERSONAL_SIGN,
  PROVIDER_UNDELEGATE_RESULT,
  PROVIDER_UNDELEGATE,
  REQUEST_ACCOUNTS,
  REQUEST_PERMISSIONS,
  SEND_TRANSACTION,
  SET_WALLET_MNEMONIC,
  ALLOW_SIGN_TYPED_DATA,
  DENY_SIGN_TYPED_DATA,
  SIGN_TYPED_DATA,
} from './types';

interface MessageSender {
  origin: string | undefined;
  icon: string | undefined;
}

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

interface TypedDataRequest {
  domain: TypedDataDomain;
  types: TypedDataDefinition;
  primaryType: string;
  message: TypedData;
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
  requestSender: MessageSender | null;
  requestId: string | number | null;

  connections: Record<string, Address[]>;
  isRequestingAccounts: boolean;

  isPersonalSigning: boolean;
  personalSignedMessage: Hex | null;

  isSendingTransaction: boolean;
  transaction: SendTransactionRequest | null;

  isRequestingPermissions: boolean;
  permissionRequest: PermissionRequest | null;
  permissions: WalletPermission[];

  isSigningTypedData: boolean;
  typedDataRequest: TypedDataRequest | null;
}

interface WalletState {
  mnemonic: string | null;
}

const storage = new Storage();

const providerState: ProviderState = {
  requestSender: null,
  requestId: null,

  connections: {},
  isRequestingAccounts: false,

  isPersonalSigning: false,
  personalSignedMessage: null,

  isSendingTransaction: false,
  transaction: null,

  isRequestingPermissions: false,
  permissionRequest: null,
  permissions: [],

  isSigningTypedData: false,
  typedDataRequest: null,
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

async function getAccounts(origin: string | undefined): Promise<Address[]> {
  if (!origin) {
    return [];
  }
  return providerState.connections[origin] || [];
}

async function requestAccounts(
  id: string | number,
  sender: MessageSender,
  callback: (value: AccountRequestResponse) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isRequestingAccounts = true;
  providerState.requestId = id;
  providerState.requestSender = sender;
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: REQUEST_ACCOUNTS,
    id,
  });
}

async function personalSign(
  id: string | number,
  sender: MessageSender,
  message: Hex,
  address: Address,
  callback: (value: PersonalSignResponse) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isPersonalSigning = true;
  providerState.personalSignedMessage = message;
  providerState.requestId = id;
  providerState.requestSender = sender;
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: PERSONAL_SIGN,
    id,
    data: {
      message,
    },
  });
}

async function sendTransaction(
  id: string | number,
  sender: MessageSender,
  transaction: SendTransactionRequest,
  callback: (value: Response<Hex>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isSendingTransaction = true;
  providerState.transaction = transaction;
  providerState.requestId = id;
  providerState.requestSender = sender;
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: SEND_TRANSACTION,
    id,
    data: {
      transaction,
    },
  });
}

async function getPermissions(): Promise<WalletPermission[]> {
  return providerState.permissions;
}

async function requestPermissions(
  id: string | number,
  sender: MessageSender,
  permissionRequest: PermissionRequest,
  callback: (value: Response<PermissionRequest>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isRequestingPermissions = true;
  providerState.permissionRequest = permissionRequest;
  providerState.requestId = id;
  providerState.requestSender = sender;
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: REQUEST_PERMISSIONS,
    id,
    data: {
      permissionRequest,
    },
  });
}

async function revokePermissions(
  sender: MessageSender,
  permissionRequest: PermissionRequest,
): Promise<void> {
  const origin = sender.origin;
  if (!origin) {
    return;
  }
  if (Object.keys(permissionRequest).includes('eth_accounts')) {
    providerState.connections[origin] = [];
  }
  providerState.permissions = providerState.permissions.filter((permission) => {
    return !Object.keys(permissionRequest).includes(
      permission.parentCapability,
    );
  });
}

async function signTypedData(
  id: string | number,
  sender: MessageSender,
  typedDataRequest: TypedDataRequest,
  callback: (value: Response<Hex>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.isSigningTypedData = true;
  providerState.typedDataRequest = typedDataRequest;
  providerState.requestId = id;
  providerState.requestSender = sender;
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: SIGN_TYPED_DATA,
    id,
    data: {
      typedDataRequest,
    },
  });
}

function allowAccountRequest(id: string | number, addresses: Address[]): void {
  const origin = providerState.requestSender?.origin;
  if (!origin) {
    return;
  }
  providerState.isRequestingAccounts = false;
  providerState.connections[origin] = addresses;
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
  const origin = providerState.requestSender?.origin;
  if (!origin) {
    return;
  }
  if (Object.keys(providerState.permissionRequest).includes('eth_accounts')) {
    providerState.connections[origin] = getAddresses();
  }
  const walletPermissions: WalletPermission[] = Object.keys(
    providerState.permissionRequest,
  ).map((permissionName) => {
    return {
      id: uuidv4(),
      parentCapability: permissionName,
      invoker: origin as `https://${string}`,
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

async function allowSignTypedData(id: string | number): Promise<void> {
  providerState.isSigningTypedData = false;
  if (!providerState.typedDataRequest) {
    return;
  }
  const signature = await getTypedDataSignature(providerState.typedDataRequest);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: signature,
    });
  }
}

function denySignTypedData(id: string | number): void {
  providerState.isSigningTypedData = false;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied typed data sign request'),
    });
  }
}

async function delegate(delegatee: Address, data: Hex): Promise<void> {
  if (!walletState.mnemonic) {
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_DELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'NO_ACCOUNT',
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

  try {
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
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_DELEGATE_RESULT,
      data: {
        txHash,
      },
    });
  } catch (e) {
    const error = e as SendTransactionErrorType;
    if (error.name !== 'TransactionExecutionError') {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_DELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
    }
    if (
      !error.cause ||
      (error.cause as { name: string }).name !== 'IntrinsicGasTooLowError'
    ) {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_DELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
    }
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_DELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'LOW_FUNDS',
    });
  }
}

async function undelegate(): Promise<void> {
  if (!walletState.mnemonic) {
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_UNDELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'NO_ACCOUNT',
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
    contractAddress: zeroAddress,
  });
  try {
    const txHash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      data: '0x',
      to: walletClient.account.address,
    });

    const publicClient = createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    });
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_UNDELEGATE_RESULT,
      data: {
        txHash,
      },
    });
  } catch (e) {
    const error = e as SendTransactionErrorType;
    if (error.name !== 'TransactionExecutionError') {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_UNDELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
    }
    if (
      !error.cause ||
      (error.cause as { name: string }).name !== 'IntrinsicGasTooLowError'
    ) {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_UNDELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
    }
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_UNDELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'LOW_FUNDS',
    });
  }
}

async function providerPersonalSign(message: Hex): Promise<void> {
  if (!walletState.mnemonic) {
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_PERSONAL_SIGN_RESULT,
      data: {
        signature: null,
      },
    });
    return;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  const signature = await account.signMessage({
    message: {
      raw: message,
    },
  });
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: PROVIDER_PERSONAL_SIGN_RESULT,
    data: {
      signature,
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

chrome.runtime.onMessage.addListener(
  async (request: FrontendRequestMessage, _, sendResponse) => {
    if (request.type === ALLOW_ACCOUNT_REQUEST) {
      allowAccountRequest(request.id, getAddresses());
    } else if (request.type === DENY_ACCOUNT_REQUEST) {
      denyAccountRequest(request.id);
    } else if (request.type === ALLOW_PERSONAL_SIGN) {
      allowPersonalSign(request.id);
    } else if (request.type === DENY_PERSONAL_SIGN) {
      denyPersonalSign(request.id);
    } else if (request.type === ALLOW_SEND_TRANSACTION) {
      allowSendTransaction(request.id);
    } else if (request.type === DENY_SEND_TRANSACTION) {
      denySendTransaction(request.id);
    } else if (request.type === ALLOW_REQUEST_PERMISSIONS) {
      allowRequestPermissions(request.id);
    } else if (request.type === DENY_REQUEST_PERMISSIONS) {
      denyRequestPermissions(request.id);
    } else if (request.type === ALLOW_SIGN_TYPED_DATA) {
      allowSignTypedData(request.id);
    } else if (request.type === DENY_SIGN_TYPED_DATA) {
      denySignTypedData(request.id);
    } else if (request.type === PROVIDER_DELEGATE) {
      const delegatee = request.data.delegatee;
      const data = request.data.data;
      await delegate(delegatee, data);
    } else if (request.type === PROVIDER_UNDELEGATE) {
      await undelegate();
    } else if (request.type === PROVIDER_PERSONAL_SIGN) {
      const message = request.data.message;
      await providerPersonalSign(message);
    } else if (request.type === GET_PROVIDER_STATE) {
      sendResponse(providerState);
    } else if (request.type === GET_WALLET_ADDRESS) {
      const address = getWalletAddress();
      sendResponse({
        address,
      });
    } else if (request.type === GET_WALLET_MNEMONIC) {
      sendResponse({
        mnemonic: walletState.mnemonic,
      });
    } else if (request.type === SET_WALLET_MNEMONIC) {
      walletState.mnemonic = request.data;
      storage.setProviderData({ mnemonic: request.data });
    }
  },
);

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

async function getTypedDataSignature(
  typedDataRequest: TypedDataRequest,
): Promise<Hex | null> {
  if (!walletState.mnemonic) {
    return null;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  return await account.signTypedData(typedDataRequest);
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
  signTypedData,
};
export type {
  ProviderState,
  MessageSender,
  SendTransactionRequest,
  PermissionRequest,
  TypedDataRequest,
};
