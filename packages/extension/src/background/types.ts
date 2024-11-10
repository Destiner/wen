import { Address, Hex } from 'viem';

import { PermissionRequest, SendTransactionRequest } from './provider';

const ALLOW_ACCOUNT_REQUEST = 'ALLOW_ACCOUNT_REQUEST';
const DENY_ACCOUNT_REQUEST = 'DENY_ACCOUNT_REQUEST';
const ALLOW_PERSONAL_SIGN = 'ALLOW_PERSONAL_SIGN';
const DENY_PERSONAL_SIGN = 'DENY_PERSONAL_SIGN';
const ALLOW_SEND_TRANSACTION = 'ALLOW_SEND_TRANSACTION';
const DENY_SEND_TRANSACTION = 'DENY_SEND_TRANSACTION';
const ALLOW_REQUEST_PERMISSIONS = 'ALLOW_REQUEST_PERMISSIONS';
const DENY_REQUEST_PERMISSIONS = 'DENY_REQUEST_PERMISSIONS';
const DELEGATE = 'DELEGATE';
const UNDELEGATE = 'UNDELEGATE';
const PROVIDER_PERSONAL_SIGN = 'PROVIDER_PERSONAL_SIGN';
const GET_PROVIDER_STATE = 'GET_PROVIDER_STATE';
const GET_WALLET_ADDRESS = 'GET_WALLET_ADDRESS';
const GET_WALLET_MNEMONIC = 'GET_WALLET_MNEMONIC';
const SET_WALLET_MNEMONIC = 'SET_WALLET_MNEMONIC';

const REQUEST_ACCOUNTS = 'REQUEST_ACCOUNTS';
const PERSONAL_SIGN = 'PERSONAL_SIGN';
const SEND_TRANSACTION = 'SEND_TRANSACTION';
const REQUEST_PERMISSIONS = 'REQUEST_PERMISSIONS';
const DELEGATED = 'DELEGATED';
const UNDELEGATED = 'UNDELEGATED';
const PROVIDER_PERSONAL_SIGN_RESULT = 'PROVIDER_PERSONAL_SIGN_RESULT';

interface BaseRequestMessage<
  T = RequestMessageType,
  D = undefined,
  E = undefined,
> {
  id?: string | number;
  type: T;
  data?: D;
  error?: E;
}

interface BaseIdRequestMessage<
  T = RequestMessageType,
  D = undefined,
  E = undefined,
> extends BaseRequestMessage<T, D, E> {
  id: string | number;
  data: D;
  error?: E;
}

type FrontendRequestMessageType =
  | typeof ALLOW_ACCOUNT_REQUEST
  | typeof DENY_ACCOUNT_REQUEST
  | typeof ALLOW_PERSONAL_SIGN
  | typeof DENY_PERSONAL_SIGN
  | typeof ALLOW_SEND_TRANSACTION
  | typeof DENY_SEND_TRANSACTION
  | typeof ALLOW_REQUEST_PERMISSIONS
  | typeof DENY_REQUEST_PERMISSIONS
  | typeof DELEGATE
  | typeof UNDELEGATE
  | typeof PROVIDER_PERSONAL_SIGN
  | typeof GET_PROVIDER_STATE
  | typeof GET_WALLET_ADDRESS
  | typeof GET_WALLET_MNEMONIC
  | typeof SET_WALLET_MNEMONIC;

type BackendRequestMessageType =
  | typeof REQUEST_ACCOUNTS
  | typeof PERSONAL_SIGN
  | typeof SEND_TRANSACTION
  | typeof REQUEST_PERMISSIONS
  | typeof DELEGATED
  | typeof PROVIDER_PERSONAL_SIGN_RESULT;

type RequestMessageType =
  | FrontendRequestMessageType
  | BackendRequestMessageType;

type AllowAccountRequestMessage = BaseIdRequestMessage<
  typeof ALLOW_ACCOUNT_REQUEST
>;
type DenyAccountRequestMessage = BaseIdRequestMessage<
  typeof DENY_ACCOUNT_REQUEST
>;
type AllowPersonalSignMessage = BaseIdRequestMessage<
  typeof ALLOW_PERSONAL_SIGN
>;
type DenyPersonalSignMessage = BaseIdRequestMessage<typeof DENY_PERSONAL_SIGN>;
type AllowSendTransactionMessage = BaseIdRequestMessage<
  typeof ALLOW_SEND_TRANSACTION
>;
type DenySendTransactionMessage = BaseIdRequestMessage<
  typeof DENY_SEND_TRANSACTION
>;
type AllowRequestPermissionsMessage = BaseIdRequestMessage<
  typeof ALLOW_REQUEST_PERMISSIONS
>;
type DenyRequestPermissionsMessage = BaseIdRequestMessage<
  typeof DENY_REQUEST_PERMISSIONS
>;
type DelegateMessage = BaseIdRequestMessage<
  typeof DELEGATE,
  { delegatee: Address; data: Hex }
>;
type UndelegateMessage = BaseIdRequestMessage<typeof UNDELEGATE>;
type ProviderPersonalSignMessage = BaseIdRequestMessage<
  typeof PROVIDER_PERSONAL_SIGN,
  { message: Hex }
>;
type GetProviderStateMessage = BaseIdRequestMessage<typeof GET_PROVIDER_STATE>;
type GetWalletAddressMessage = BaseIdRequestMessage<typeof GET_WALLET_ADDRESS>;
type GetWalletMnemonicMessage = BaseIdRequestMessage<
  typeof GET_WALLET_MNEMONIC
>;
type SetWalletMnemonicMessage = BaseIdRequestMessage<
  typeof SET_WALLET_MNEMONIC,
  string | null
>;

type RequestAccountsMessage = BaseRequestMessage<typeof REQUEST_ACCOUNTS>;
type PersonalSignMessage = BaseRequestMessage<
  typeof PERSONAL_SIGN,
  {
    message: Hex;
  }
>;
type SendTransactionMessage = BaseRequestMessage<
  typeof SEND_TRANSACTION,
  {
    transaction: SendTransactionRequest;
  }
>;
type RequestPermissionsMessage = BaseRequestMessage<
  typeof REQUEST_PERMISSIONS,
  {
    permissionRequest: PermissionRequest;
  }
>;
type DelegatedMessage = BaseRequestMessage<
  typeof DELEGATED,
  {
    txHash: Hex | null;
  },
  'NO_ACCOUNT' | 'LOW_FUNDS' | 'UNKNOWN'
>;
type UndelegatedMessage = BaseRequestMessage<
  typeof UNDELEGATED,
  {
    txHash: Hex | null;
  },
  'NO_ACCOUNT' | 'LOW_FUNDS' | 'UNKNOWN'
>;
type ProviderPersonalSignResultMessage = BaseRequestMessage<
  typeof PROVIDER_PERSONAL_SIGN_RESULT,
  { signature: Hex | null }
>;

type FrontendRequestMessage =
  | AllowAccountRequestMessage
  | DenyAccountRequestMessage
  | AllowPersonalSignMessage
  | DenyPersonalSignMessage
  | AllowSendTransactionMessage
  | DenySendTransactionMessage
  | AllowRequestPermissionsMessage
  | DenyRequestPermissionsMessage
  | DelegateMessage
  | UndelegateMessage
  | ProviderPersonalSignMessage
  | GetProviderStateMessage
  | GetWalletAddressMessage
  | GetWalletMnemonicMessage
  | SetWalletMnemonicMessage;

type BackendRequestMessage =
  | RequestAccountsMessage
  | PersonalSignMessage
  | SendTransactionMessage
  | RequestPermissionsMessage
  | DelegatedMessage
  | UndelegatedMessage
  | ProviderPersonalSignResultMessage;

type RequestMessage = FrontendRequestMessage | BackendRequestMessage;

export {
  ALLOW_ACCOUNT_REQUEST,
  DENY_ACCOUNT_REQUEST,
  ALLOW_PERSONAL_SIGN,
  DENY_PERSONAL_SIGN,
  ALLOW_SEND_TRANSACTION,
  DENY_SEND_TRANSACTION,
  ALLOW_REQUEST_PERMISSIONS,
  DENY_REQUEST_PERMISSIONS,
  DELEGATE,
  UNDELEGATE,
  PROVIDER_PERSONAL_SIGN,
  GET_PROVIDER_STATE,
  GET_WALLET_ADDRESS,
  GET_WALLET_MNEMONIC,
  SET_WALLET_MNEMONIC,
  REQUEST_ACCOUNTS,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  REQUEST_PERMISSIONS,
  DELEGATED,
  UNDELEGATED,
  PROVIDER_PERSONAL_SIGN_RESULT,
};
export type {
  RequestMessage,
  FrontendRequestMessage,
  BackendRequestMessage,
  BaseRequestMessage,
  AllowAccountRequestMessage,
  DenyAccountRequestMessage,
  AllowPersonalSignMessage,
  DenyPersonalSignMessage,
  AllowSendTransactionMessage,
  DenySendTransactionMessage,
  AllowRequestPermissionsMessage,
  DenyRequestPermissionsMessage,
  DelegateMessage,
  UndelegateMessage,
  ProviderPersonalSignMessage,
  GetProviderStateMessage,
  GetWalletAddressMessage,
  GetWalletMnemonicMessage,
  SetWalletMnemonicMessage,
  RequestAccountsMessage,
  PersonalSignMessage,
  SendTransactionMessage,
  RequestPermissionsMessage,
  DelegatedMessage,
  UndelegatedMessage,
  ProviderPersonalSignResultMessage,
};
