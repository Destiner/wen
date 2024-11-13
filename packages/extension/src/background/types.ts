import { Address, Hex, WalletGetCallsStatusReturnType } from 'viem';

import {
  MessageSender,
  PermissionRequestData,
  SendTransactionRequestData,
  TypedDataRequestData,
  WalletCallRequestData,
} from './provider';

const ALLOW_ACCOUNT_REQUEST = 'ALLOW_ACCOUNT_REQUEST';
const DENY_ACCOUNT_REQUEST = 'DENY_ACCOUNT_REQUEST';
const ALLOW_PERSONAL_SIGN = 'ALLOW_PERSONAL_SIGN';
const DENY_PERSONAL_SIGN = 'DENY_PERSONAL_SIGN';
const ALLOW_SEND_TRANSACTION = 'ALLOW_SEND_TRANSACTION';
const DENY_SEND_TRANSACTION = 'DENY_SEND_TRANSACTION';
const ALLOW_REQUEST_PERMISSIONS = 'ALLOW_REQUEST_PERMISSIONS';
const DENY_REQUEST_PERMISSIONS = 'DENY_REQUEST_PERMISSIONS';
const ALLOW_SIGN_TYPED_DATA = 'ALLOW_SIGN_TYPED_DATA';
const DENY_SIGN_TYPED_DATA = 'DENY_SIGN_TYPED_DATA';
const ALLOW_WALLET_SEND_CALLS = 'ALLOW_WALLET_SEND_CALLS';
const DENY_WALLET_SEND_CALLS = 'DENY_WALLET_SEND_CALLS';
const HIDE_CALLS_STATUS = 'HIDE_CALLS_STATUS';
const PROVIDER_DELEGATE = 'PROVIDER_DELEGATE';
const PROVIDER_UNDELEGATE = 'PROVIDER_UNDELEGATE';
const PROVIDER_PERSONAL_SIGN = 'PROVIDER_PERSONAL_SIGN';
const GET_PROVIDER_STATE = 'GET_PROVIDER_STATE';
const GET_WALLET_ADDRESS = 'GET_WALLET_ADDRESS';
const GET_WALLET_MNEMONIC = 'GET_WALLET_MNEMONIC';
const SET_WALLET_MNEMONIC = 'SET_WALLET_MNEMONIC';

const REQUEST_ACCOUNTS = 'REQUEST_ACCOUNTS';
const PERSONAL_SIGN = 'PERSONAL_SIGN';
const SEND_TRANSACTION = 'SEND_TRANSACTION';
const REQUEST_PERMISSIONS = 'REQUEST_PERMISSIONS';
const SIGN_TYPED_DATA = 'SIGN_TYPED_DATA';
const WALLET_SEND_CALLS = 'WALLET_SEND_CALLS';
const SHOW_CALLS_STATUS = 'SHOW_CALLS_STATUS';
const PROVIDER_DELEGATE_RESULT = 'PROVIDER_DELEGATE_RESULT';
const PROVIDER_UNDELEGATE_RESULT = 'PROVIDER_UNDELEGATE_RESULT';
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

interface BaseSenderRequestMessage<
  T = RequestMessageType,
  D = undefined,
  E = undefined,
> {
  id: string | number;
  sender: MessageSender;
  type: T;
  data?: D;
  error?: E;
}

interface BaseIdRequestMessage<
  T = RequestMessageType,
  D = undefined,
  E = undefined,
> {
  id: string | number;
  type: T;
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
  | typeof ALLOW_SIGN_TYPED_DATA
  | typeof DENY_SIGN_TYPED_DATA
  | typeof ALLOW_WALLET_SEND_CALLS
  | typeof DENY_WALLET_SEND_CALLS
  | typeof HIDE_CALLS_STATUS
  | typeof PROVIDER_DELEGATE
  | typeof PROVIDER_UNDELEGATE
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
  | typeof SIGN_TYPED_DATA
  | typeof WALLET_SEND_CALLS
  | typeof SHOW_CALLS_STATUS
  | typeof PROVIDER_DELEGATE_RESULT
  | typeof PROVIDER_UNDELEGATE_RESULT
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
type AllowSignTypedDataMessage = BaseIdRequestMessage<
  typeof ALLOW_SIGN_TYPED_DATA
>;
type DenySignTypedDataMessage = BaseIdRequestMessage<
  typeof DENY_SIGN_TYPED_DATA
>;
type AllowWalletSendCallsMessage = BaseIdRequestMessage<
  typeof ALLOW_WALLET_SEND_CALLS
>;
type DenyWalletSendCallsMessage = BaseIdRequestMessage<
  typeof DENY_WALLET_SEND_CALLS
>;
type HideCallsStatusMessage = BaseIdRequestMessage<typeof HIDE_CALLS_STATUS>;
type ProviderDelegateMessage = BaseIdRequestMessage<
  typeof PROVIDER_DELEGATE,
  { delegatee: Address; data: Hex; isSponsored: boolean }
>;
type ProviderUndelegateMessage = BaseIdRequestMessage<
  typeof PROVIDER_UNDELEGATE,
  { isSponsored: boolean }
>;
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

type RequestAccountsMessage = BaseSenderRequestMessage<typeof REQUEST_ACCOUNTS>;
type PersonalSignMessage = BaseSenderRequestMessage<
  typeof PERSONAL_SIGN,
  {
    message: Hex;
  }
>;
type SendTransactionMessage = BaseSenderRequestMessage<
  typeof SEND_TRANSACTION,
  {
    transaction: SendTransactionRequestData;
  }
>;
type RequestPermissionsMessage = BaseSenderRequestMessage<
  typeof REQUEST_PERMISSIONS,
  {
    permissionRequest: PermissionRequestData;
  }
>;
type SignTypedDataMessage = BaseSenderRequestMessage<
  typeof SIGN_TYPED_DATA,
  {
    typedDataRequest: TypedDataRequestData;
  }
>;
type WalletSendCallsMessage = BaseSenderRequestMessage<
  typeof WALLET_SEND_CALLS,
  {
    walletCallRequest: WalletCallRequestData;
  }
>;
type ShowCallsStatusMessage = BaseSenderRequestMessage<
  typeof SHOW_CALLS_STATUS,
  {
    callsStatus: WalletGetCallsStatusReturnType;
  }
>;
type ProviderDelegateResultMessage = BaseRequestMessage<
  typeof PROVIDER_DELEGATE_RESULT,
  {
    txHash: Hex | null;
  },
  'NO_ACCOUNT' | 'LOW_FUNDS' | 'UNKNOWN'
>;
type ProviderUndelegateResultMessage = BaseRequestMessage<
  typeof PROVIDER_UNDELEGATE_RESULT,
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
  | AllowSignTypedDataMessage
  | DenySignTypedDataMessage
  | AllowWalletSendCallsMessage
  | DenyWalletSendCallsMessage
  | HideCallsStatusMessage
  | ProviderDelegateMessage
  | ProviderUndelegateMessage
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
  | SignTypedDataMessage
  | WalletSendCallsMessage
  | ShowCallsStatusMessage
  | ProviderDelegateResultMessage
  | ProviderUndelegateResultMessage
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
  ALLOW_SIGN_TYPED_DATA,
  DENY_SIGN_TYPED_DATA,
  ALLOW_WALLET_SEND_CALLS,
  DENY_WALLET_SEND_CALLS,
  HIDE_CALLS_STATUS,
  PROVIDER_DELEGATE,
  PROVIDER_UNDELEGATE,
  PROVIDER_PERSONAL_SIGN,
  GET_PROVIDER_STATE,
  GET_WALLET_ADDRESS,
  GET_WALLET_MNEMONIC,
  SET_WALLET_MNEMONIC,
  REQUEST_ACCOUNTS,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  REQUEST_PERMISSIONS,
  SIGN_TYPED_DATA,
  WALLET_SEND_CALLS,
  SHOW_CALLS_STATUS,
  PROVIDER_DELEGATE_RESULT,
  PROVIDER_UNDELEGATE_RESULT,
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
  AllowSignTypedDataMessage,
  DenySignTypedDataMessage,
  AllowWalletSendCallsMessage,
  DenyWalletSendCallsMessage,
  HideCallsStatusMessage,
  ProviderDelegateMessage,
  ProviderUndelegateMessage,
  ProviderPersonalSignMessage,
  GetProviderStateMessage,
  GetWalletAddressMessage,
  GetWalletMnemonicMessage,
  SetWalletMnemonicMessage,
  RequestAccountsMessage,
  SignTypedDataMessage,
  PersonalSignMessage,
  SendTransactionMessage,
  RequestPermissionsMessage,
  WalletSendCallsMessage,
  ShowCallsStatusMessage,
  ProviderDelegateResultMessage,
  ProviderUndelegateResultMessage,
  ProviderPersonalSignResultMessage,
};
