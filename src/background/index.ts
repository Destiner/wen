import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import { Address, Hex } from 'viem';
import { type Runtime, runtime } from 'webextension-polyfill';

import {
  type SendTransactionRequest,
  getChainId,
  getAccounts,
  requestAccounts,
  personalSign,
  sendTransaction,
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
      const accounts = await getAccounts();
      port.postMessage({
        jsonrpc: '2.0',
        id: data.id,
        result: accounts,
      });
    }
    if (data.method === 'eth_requestAccounts') {
      openPopup();
      requestAccounts(id, (response) => {
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
      personalSign(id, message, address, (response) => {
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
      const params = data.params as [SendTransactionRequest];
      const transaction = params[0];
      openPopup();
      sendTransaction(id, transaction, (response) => {
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
  });
}

function openPopup(): void {
  chrome.windows.getCurrent({ populate: true }, function (window) {
    const width = 360;
    const height = 600;
    const windowWidth = window.width || width;
    const windowLeft = window.left || 0;
    const left = windowWidth + windowLeft - width - 8;
    const top = (window.top || 0) + 8;
    chrome.windows.create({
      url: chrome.runtime.getURL('popup/index.html'),
      type: 'popup',
      width,
      height,
      top,
      left,
    });
  });
}

export { init, setupProviderConnection };
