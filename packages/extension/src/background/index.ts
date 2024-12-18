import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import { Address, Hex } from 'viem';
import { type Runtime, runtime } from 'webextension-polyfill';

import {
  type SendTransactionRequestData,
  type MessageSender,
  type PermissionRequestData,
  type TypedDataRequestData,
  getChainId,
  getAccounts,
  requestAccounts,
  personalSign,
  sendTransaction,
  requestPermissions,
  getPermissions,
  revokePermissions,
  signTypedData,
  getCapabilities,
  walletSendCalls,
  getCallsStatus,
  showCallsStatus,
} from './provider';

init();

async function init(): Promise<void> {
  runtime.onConnect.addListener((port: Runtime.Port) => {
    setupProviderConnection(port);
  });
}

function setupProviderConnection(port: Runtime.Port): void {
  port.onMessage.addListener(async (message: unknown): Promise<void> => {
    const data = message as JsonRpcRequest<JsonRpcParams>;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (data.data === 'ping') {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (data.data === '{"type":"ping"}') {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (data.type === 'connected') {
      return;
    }

    const sender: MessageSender = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      origin: port.sender?.origin,
      icon: port.sender?.tab?.favIconUrl,
    };

    const id = data.id || 'ID';
    if (data.method === 'eth_chainId') {
      const chainId = getChainId();
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: chainId,
      });
    }
    if (data.method === 'eth_accounts') {
      const accounts = await getAccounts(sender.origin);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: accounts,
      });
    }
    if (data.method === 'eth_requestAccounts') {
      openPopup();
      requestAccounts(id, sender, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
    }
    if (data.method === 'personal_sign') {
      const params = data.params as [Address, Hex];
      const message = params[0] as Hex;
      const address = params[1] as Address;
      openPopup();
      personalSign(id, sender, message, address, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
    }
    if (data.method === 'eth_sendTransaction') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [SendTransactionRequestData];
      const transaction = params[0];
      openPopup();
      sendTransaction(id, sender, transaction, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
    }
    if (data.method === 'wallet_getPermissions') {
      const permissions = getPermissions(sender);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: permissions,
      });
    }
    if (data.method === 'wallet_requestPermissions') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [PermissionRequestData];
      const permissionRequest = params[0];
      openPopup();
      requestPermissions(id, sender, permissionRequest, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
    }
    if (data.method === 'wallet_revokePermissions') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [PermissionRequestData];
      const permissionRequest = params[0];
      revokePermissions(sender, permissionRequest);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: null,
      });
    }
    if (data.method === 'eth_signTypedData_v4') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [Address, TypedDataRequestData];
      const request = params[1];
      openPopup();
      signTypedData(id, sender, request, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
    }
    if (data.method === 'wallet_getCapabilities') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [Address];
      const address = params[0];
      const capabilities = await getCapabilities(address);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: capabilities,
      });
    }
    if (data.method === 'wallet_sendCalls') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [WalletCallRequestData];
      const request = params[0];
      const isValid = await walletSendCalls(id, sender, request, (response) => {
        if (response.status === true) {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            result: response.result,
          });
        } else {
          port.postMessage({
            jsonrpc: '2.0',
            id: data.id,
            error: response.error,
          });
        }
      });
      if (isValid) {
        openPopup();
      }
    }
    if (data.method === 'wallet_getCallsStatus') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [Hex];
      const identifier = params[0];
      const status = await getCallsStatus(identifier);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: status,
      });
    }
    if (data.method === 'wallet_showCallsStatus') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const params = data.params as [Hex];
      const identifier = params[0];
      openPopup();
      await showCallsStatus(id, sender, identifier);
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: null,
      });
    }
  });
}

function openPopup(): void {
  chrome.windows.getCurrent({ populate: true }, function (window) {
    const width = 340;
    const height = 640;
    const windowWidth = window.width || width;
    const windowLeft = window.left || 0;
    const left = windowWidth + windowLeft - width - 8;
    const top = (window.top || 0) + 8;
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width,
      height,
      top,
      left,
    });
  });
}

export { init, setupProviderConnection };
