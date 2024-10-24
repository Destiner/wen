import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import { type Runtime, runtime } from 'webextension-polyfill';

import { request } from './provider';

init();

async function init(): Promise<void> {
  runtime.onConnect.addListener((port: Runtime.Port) => {
    setupProviderConnection(port);
  });
}

function setupProviderConnection(port: Runtime.Port): void {
  port.onMessage.addListener(async (message: unknown): Promise<void> => {
    const data = message as JsonRpcRequest<JsonRpcParams>;

    if (data.method === 'eth_requestAccounts') {
      const id = data.id || 'ID';
      openPopup();
      request(id, (response) => {
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
