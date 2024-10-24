/*
 * In-page provider injection
 * Heavily inspired by ethui
 */
import type { Duplex } from 'node:stream';

import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { runtime } from 'webextension-polyfill';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import inpageScript from './inpage/index.js?script&module';

const name = 'wen';

declare global {
  interface Document {
    prerendering: boolean;
  }
}

(async (): Promise<void> => init())();

async function init(): Promise<void> {
  initProviderForward();
  injectInPageScript();
}

function initProviderForward(): void {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => {
      if (!document.prerendering) {
        initProviderForward();
      }
    });
    return;
  }

  const inpageStream = new WindowPostMessageStream({
    name: `${name}:contentscript`,
    target: `${name}:inpage`,
  }) as unknown as Duplex;

  const bgPort = runtime.connect({ name: `${name}:contentscript` });

  window.onbeforeunload = (): void => {
    bgPort.disconnect();
  };

  // inpage -> bg
  inpageStream.on('data', async (data) => {
    bgPort.postMessage(data);
  });
  // bg -> inpage
  bgPort.onMessage.addListener((data) => {
    inpageStream.write(data);
  });
}

function injectInPageScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(inpageScript);
  script.type = 'module';
  document.head.prepend(script);
}

// eslint-disable-next-line import-x/prefer-default-export
export { injectInPageScript };
