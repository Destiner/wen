import {
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  SendTransactionErrorType,
  slice,
  toHex,
  TypedData,
  TypedDataDefinition,
  TypedDataDomain,
  WalletCapabilitiesRecord,
  WalletGetCallsStatusReturnType,
  WalletPermission,
  zeroAddress,
} from 'viem';
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint07Address,
} from 'viem/account-abstraction';
import { mnemonicToAccount } from 'viem/accounts';
import { odysseyTestnet } from 'viem/chains';
import { eip7702Actions } from 'viem/experimental';

import { Execution, getOpHash, prepareOp, submitOp } from '@/utils/aa';
import { KERNEL_V3_IMPLEMENTATION_ADDRESS } from '@/utils/consts';

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
  WALLET_SEND_CALLS,
  SHOW_CALLS_STATUS,
  ALLOW_WALLET_SEND_CALLS,
  DENY_WALLET_SEND_CALLS,
  HIDE_CALLS_STATUS,
} from './types';

interface MessageSender {
  origin: string | undefined;
  icon: string | undefined;
}

interface SendTransactionRequestData {
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

interface TypedDataRequestData {
  domain: TypedDataDomain;
  types: TypedDataDefinition;
  primaryType: string;
  message: TypedData;
}

interface PermissionRequestData {
  [methodName: string]: {
    [caveatName: string]: unknown;
  };
}

interface WalletCall {
  to?: Address;
  value?: Hex;
  data: Hex;
}

interface WalletCallRequestData {
  version: string;
  chainId: Hex;
  from: Address;
  calls: WalletCall[];
  capabilities: WalletCapabilitiesRecord;
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

interface BaseRequest {
  sender: MessageSender;
  id: string | number;
}

interface AccountRequest extends BaseRequest {
  type: 'account';
}

interface PersonalSignRequest extends BaseRequest {
  type: 'personal_sign';
  message: Hex;
}

interface SendTransactionRequest extends BaseRequest {
  type: 'send_transaction';
  transaction: SendTransactionRequestData;
}

interface PermissionRequest extends BaseRequest {
  type: 'request_permissions';
  permissionRequest: PermissionRequestData;
}

interface TypedDataRequest extends BaseRequest {
  type: 'sign_typed_data';
  typedDataRequest: TypedDataRequestData;
}

interface WalletCallRequest extends BaseRequest {
  type: 'wallet_send_calls';
  walletCallRequest: WalletCallRequestData;
}

interface ShowCallsStatusRequest extends BaseRequest {
  type: 'show_calls_status';
  walletCallStatus: WalletGetCallsStatusReturnType;
}

type ProviderRequest =
  | AccountRequest
  | PersonalSignRequest
  | SendTransactionRequest
  | PermissionRequest
  | TypedDataRequest
  | WalletCallRequest
  | ShowCallsStatusRequest;

interface ProviderState {
  activeRequest: ProviderRequest | null;
  connections: Record<string, Address[]>;
  permissions: Record<string, WalletPermission[]>;
}

interface WalletState {
  mnemonic: string | null;
}

const storage = new Storage();

const providerState: ProviderState = {
  activeRequest: null,
  connections: {},
  permissions: {},
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
  providerState.activeRequest = {
    type: 'account',
    id,
    sender,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: REQUEST_ACCOUNTS,
    id,
    sender,
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
  providerState.activeRequest = {
    type: 'personal_sign',
    id,
    sender,
    message,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: PERSONAL_SIGN,
    id,
    sender,
    data: {
      message,
    },
  });
}

async function sendTransaction(
  id: string | number,
  sender: MessageSender,
  transaction: SendTransactionRequestData,
  callback: (value: Response<Hex>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.activeRequest = {
    type: 'send_transaction',
    id,
    sender,
    transaction,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: SEND_TRANSACTION,
    id,
    sender,
    data: {
      transaction,
    },
  });
}

async function getPermissions(
  sender: MessageSender,
): Promise<WalletPermission[]> {
  const origin = sender.origin;
  if (!origin) {
    return [];
  }
  return providerState.permissions[origin] || [];
}

async function requestPermissions(
  id: string | number,
  sender: MessageSender,
  permissionRequest: PermissionRequestData,
  callback: (value: Response<PermissionRequestData>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.activeRequest = {
    type: 'request_permissions',
    id,
    sender,
    permissionRequest,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: REQUEST_PERMISSIONS,
    id,
    sender,
    data: {
      permissionRequest,
    },
  });
}

async function revokePermissions(
  sender: MessageSender,
  permissionRequest: PermissionRequestData,
): Promise<void> {
  const origin = sender.origin;
  if (!origin) {
    return;
  }
  if (Object.keys(permissionRequest).includes('eth_accounts')) {
    providerState.connections[origin] = [];
  }
  const originPermissions = providerState.permissions[origin] || [];
  providerState.permissions[origin] = originPermissions.filter((permission) => {
    return !Object.keys(permissionRequest).includes(
      permission.parentCapability,
    );
  });
}

async function signTypedData(
  id: string | number,
  sender: MessageSender,
  typedDataRequest: TypedDataRequestData,
  callback: (value: Response<Hex>) => void,
): Promise<void> {
  callbacks[id] = callback;
  providerState.activeRequest = {
    type: 'sign_typed_data',
    id,
    sender,
    typedDataRequest,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: SIGN_TYPED_DATA,
    id,
    sender,
    data: {
      typedDataRequest,
    },
  });
}

async function getCapabilities(
  address: Address,
): Promise<WalletCapabilitiesRecord> {
  const addresses = getAddresses();
  if (!addresses.includes(address.toLowerCase() as Address)) {
    return {};
  }
  // Make sure that it delegates to the correct address
  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const code = await publicClient.getCode({ address });
  if (!code) {
    return {};
  }
  if (!code.startsWith('0xef0100')) {
    return {};
  }
  const delegatee = slice(code, 3, 3 + 20);
  if (delegatee !== KERNEL_V3_IMPLEMENTATION_ADDRESS) {
    return {};
  }
  return {
    [toHex(odysseyTestnet.id)]: {
      atomicBatch: {
        supported: true,
      },
      paymasterService: {
        supported: true,
      },
    },
  };
}

async function walletSendCalls(
  id: string | number,
  sender: MessageSender,
  walletCallRequest: WalletCallRequestData,
  callback: (value: Response<Hex>) => void,
): Promise<boolean> {
  const { version, chainId, from, calls } = walletCallRequest;
  if (version !== '1.0') {
    callback({
      status: false,
      error: new Error('Unsupported version'),
    });
    return false;
  }

  if (chainId !== toHex(odysseyTestnet.id)) {
    callback({
      status: false,
      error: new Error('Unsupported chain'),
    });
    return false;
  }
  const addresses = getAddresses();
  if (!addresses.includes(from.toLowerCase() as Address)) {
    callback({
      status: false,
      error: new Error('Account is not connected'),
    });
    return false;
  }
  if (calls.length === 0) {
    callback({
      status: false,
      error: new Error('Calls are empty'),
    });
    return false;
  }
  callbacks[id] = callback;
  providerState.activeRequest = {
    type: 'wallet_send_calls',
    id,
    sender,
    walletCallRequest,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: WALLET_SEND_CALLS,
    id,
    sender,
    data: {
      walletCallRequest,
    },
  });
  return true;
}

async function getCallsStatus(
  identifier: Hex,
): Promise<WalletGetCallsStatusReturnType> {
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(`https://public.pimlico.io/v2/${odysseyTestnet.id}/rpc`),
  });
  const receiptResult = await bundlerClient.getUserOperationReceipt({
    hash: identifier,
  });
  if (!receiptResult) {
    return {
      status: 'PENDING',
    };
  }
  return {
    status: 'CONFIRMED',
    receipts: [
      {
        logs: receiptResult.receipt.logs.map((log) => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
        })),
        status: receiptResult.receipt.status === 'success' ? '0x1' : '0x0',
        blockHash: receiptResult.receipt.blockHash,
        blockNumber: toHex(receiptResult.receipt.blockNumber),
        gasUsed: toHex(receiptResult.receipt.gasUsed),
        transactionHash: receiptResult.receipt.transactionHash,
      },
    ],
  };
}

async function showCallsStatus(
  id: string | number,
  sender: MessageSender,
  identifier: Hex,
): Promise<void> {
  const callsStatus = await getCallsStatus(identifier);
  providerState.activeRequest = {
    type: 'show_calls_status',
    id,
    sender,
    walletCallStatus: callsStatus,
  };
  chrome.runtime.sendMessage<BackendRequestMessage>({
    type: SHOW_CALLS_STATUS,
    id,
    sender,
    data: {
      callsStatus,
    },
  });
}

function allowAccountRequest(id: string | number, addresses: Address[]): void {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'account') {
    return;
  }
  const origin = providerState.activeRequest.sender.origin;
  if (!origin) {
    return;
  }
  providerState.activeRequest = null;
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
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied connection request'),
    });
  }
}

async function allowPersonalSign(id: string | number): Promise<void> {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'personal_sign') {
    return;
  }
  const message = providerState.activeRequest.message;
  providerState.activeRequest = null;
  const signature = await getPersonalSignature(message);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: signature,
    });
  }
}

function denyPersonalSign(id: string | number): void {
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied personal sign request'),
    });
  }
}

async function allowSendTransaction(id: string | number): Promise<void> {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'send_transaction') {
    return;
  }
  const transaction = providerState.activeRequest.transaction;
  providerState.activeRequest = null;
  const txHash = await submitTransaction(transaction);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: txHash,
    });
  }
}

function denySendTransaction(id: string | number): void {
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied transaction request'),
    });
  }
}

async function allowRequestPermissions(id: string | number): Promise<void> {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'request_permissions') {
    return;
  }
  const origin = providerState.activeRequest.sender.origin;
  if (!origin) {
    return;
  }
  const permissionRequest = providerState.activeRequest.permissionRequest;
  providerState.activeRequest = null;
  if (Object.keys(permissionRequest).includes('eth_accounts')) {
    providerState.connections[origin] = getAddresses();
  }
  const walletPermissions: WalletPermission[] = Object.keys(
    permissionRequest,
  ).map((permissionName) => {
    return {
      id: crypto.randomUUID(),
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
  providerState.permissions[origin] = walletPermissions;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: walletPermissions,
    });
  }
}

function denyRequestPermissions(id: string | number): void {
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied permission request'),
    });
  }
}

async function allowSignTypedData(id: string | number): Promise<void> {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'sign_typed_data') {
    return;
  }
  const typedDataRequest = providerState.activeRequest.typedDataRequest;
  providerState.activeRequest = null;
  const signature = await getTypedDataSignature(typedDataRequest);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: signature,
    });
  }
}

function denySignTypedData(id: string | number): void {
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied typed data sign request'),
    });
  }
}

async function allowWalletSendCalls(id: string | number): Promise<void> {
  if (!providerState.activeRequest) {
    return;
  }
  if (providerState.activeRequest.type !== 'wallet_send_calls') {
    return;
  }
  const walletCallRequest = providerState.activeRequest.walletCallRequest;
  providerState.activeRequest = null;
  const opHash = await sendWalletCalls(walletCallRequest);
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: true,
      result: opHash,
    });
  }
}

function denyWalletSendCalls(id: string | number): void {
  providerState.activeRequest = null;
  const callback = callbacks[id];
  if (callback) {
    callback({
      status: false,
      error: new Error('User denied wallet send calls request'),
    });
  }
}

function hideCallsStatus(): void {
  providerState.activeRequest = null;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function walletSendTransactionExtension(
  client: ReturnType<typeof createPublicClient>,
) {
  return {
    async walletSendTransaction(transaction: {
      authorizationList?: {
        address: Address;
        chainId: number;
        nonce: number;
        r: Hex;
        s: Hex;
        yParity: number;
      }[];
      data?: Hex;
      to: Address;
    }): Promise<Hex | null> {
      const response = (await client.request({
        method: 'wallet_sendTransaction',
        params: [
          {
            authorizationList: transaction.authorizationList
              ? transaction.authorizationList.map((authorization) => ({
                  address: authorization.address,
                  chainId: `0x${authorization.chainId.toString(16)}` as Hex,
                  nonce: `0x${authorization.nonce.toString(16)}` as Hex,
                  r: authorization.r,
                  s: authorization.s,
                  yParity: `0x${authorization.yParity.toString(16)}` as Hex,
                }))
              : undefined,
            data: transaction.data,
            to: transaction.to,
          },
        ],
      })) as Hex | null;
      return response;
    },
  };
}

async function delegate(
  delegatee: Address,
  data: Hex,
  isSponsored: boolean,
): Promise<void> {
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
  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  }).extend(walletSendTransactionExtension);
  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });
  const walletClient = createWalletClient({
    account,
    chain: odysseyTestnet,
    transport: http(),
  }).extend(eip7702Actions());
  const authorization = await walletClient.signAuthorization({
    contractAddress: delegatee,
    nonce: isSponsored ? nonce : undefined,
  });

  if (authorization.yParity === undefined) {
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_DELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'UNKNOWN',
    });
    return;
  }

  try {
    const txHash = isSponsored
      ? await publicClient.walletSendTransaction({
          authorizationList: [
            {
              address: authorization.contractAddress,
              chainId: authorization.chainId,
              nonce: authorization.nonce,
              r: authorization.r,
              s: authorization.s,
              yParity: authorization.yParity,
            },
          ],
          data,
          to: walletClient.account.address,
        })
      : await walletClient.sendTransaction({
          authorizationList: [authorization],
          data,
          to: walletClient.account.address,
        });
    if (!txHash) {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_DELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
      return;
    }
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
      return;
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
      return;
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

async function undelegate(isSponsored: boolean): Promise<void> {
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
  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  }).extend(walletSendTransactionExtension);
  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });
  const walletClient = createWalletClient({
    account,
    chain: odysseyTestnet,
    transport: http(),
  }).extend(eip7702Actions());

  const authorization = await walletClient.signAuthorization({
    contractAddress: zeroAddress,
    nonce: isSponsored ? nonce : undefined,
  });

  if (authorization.yParity === undefined) {
    chrome.runtime.sendMessage<BackendRequestMessage>({
      type: PROVIDER_DELEGATE_RESULT,
      data: {
        txHash: null,
      },
      error: 'UNKNOWN',
    });
    return;
  }

  try {
    const txHash = isSponsored
      ? await publicClient.walletSendTransaction({
          authorizationList: [
            {
              address: authorization.contractAddress,
              chainId: odysseyTestnet.id,
              nonce: authorization.nonce,
              r: authorization.r,
              s: authorization.s,
              yParity: authorization.yParity,
            },
          ],
          data: '0x',
          to: walletClient.account.address,
        })
      : await walletClient.sendTransaction({
          authorizationList: [authorization],
          data: '0x',
          to: walletClient.account.address,
        });
    if (!txHash) {
      chrome.runtime.sendMessage<BackendRequestMessage>({
        type: PROVIDER_DELEGATE_RESULT,
        data: {
          txHash: null,
        },
        error: 'UNKNOWN',
      });
      return;
    }

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
    } else if (request.type === ALLOW_WALLET_SEND_CALLS) {
      allowWalletSendCalls(request.id);
    } else if (request.type === DENY_WALLET_SEND_CALLS) {
      denyWalletSendCalls(request.id);
    } else if (request.type === HIDE_CALLS_STATUS) {
      hideCallsStatus();
    } else if (request.type === PROVIDER_DELEGATE) {
      const delegatee = request.data.delegatee;
      const data = request.data.data;
      const isSponsored = request.data.isSponsored;
      await delegate(delegatee, data, isSponsored);
    } else if (request.type === PROVIDER_UNDELEGATE) {
      const isSponsored = request.data.isSponsored;
      await undelegate(isSponsored);
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
  return [account.address.toLowerCase() as Address];
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
  transaction: SendTransactionRequestData,
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
  typedDataRequest: TypedDataRequestData,
): Promise<Hex | null> {
  if (!walletState.mnemonic) {
    return null;
  }
  const account = mnemonicToAccount(walletState.mnemonic);
  return await account.signTypedData(typedDataRequest);
}

async function sendWalletCalls({
  from,
  capabilities,
  calls,
}: WalletCallRequestData): Promise<Hex | null> {
  if (!walletState.mnemonic) {
    return null;
  }
  const chainCapabilities =
    capabilities && capabilities[toHex(odysseyTestnet.id)];
  const paymasterClient =
    chainCapabilities && chainCapabilities.paymasterService
      ? createPaymasterClient({
          transport: http(chainCapabilities.paymasterService.url),
        })
      : null;
  const executions: Execution[] = (calls as WalletCall[]).map((call) => {
    if (!call.to) {
      throw new Error('Create transactions are not supported');
    }
    return {
      target: call.to,
      value: BigInt(call.value || '0x0'),
      callData: call.data,
    };
  });
  const bundlerClient = createBundlerClient({
    client: createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    }),
    transport: http(`https://public.pimlico.io/v2/${odysseyTestnet.id}/rpc`),
  });
  const op = await prepareOp(
    from,
    bundlerClient,
    paymasterClient,
    executions,
    0n,
  );
  const opHash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!opHash) {
    return null;
  }
  const signature = await getPersonalSignature(opHash);
  if (!signature) {
    return null;
  }
  op.signature = signature;
  await submitOp(from, bundlerClient, op);
  return opHash;
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
  getCapabilities,
  walletSendCalls,
  getCallsStatus,
  showCallsStatus,
};
export type {
  ProviderState,
  ProviderRequest,
  MessageSender,
  SendTransactionRequestData,
  PermissionRequestData,
  TypedDataRequestData,
  WalletCallRequestData,
};
