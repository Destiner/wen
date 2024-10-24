/*
 * In-page provider initialization
 * Heavily inspired by ethui
 */
import type { Duplex } from 'node:stream';

import { v4 as uuidv4 } from '@lukeed/uuid';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { type EIP1193Provider, announceProvider } from 'mipd';

import { WenProvider } from './provider.js';

const name = 'wen';
const icon =
  "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='black'/%3E%3Cpath d='M23 11V8C23 7.73478 22.8946 7.48043 22.7071 7.29289C22.5196 7.10536 22.2652 7 22 7H9C8.46957 7 7.96086 7.21071 7.58579 7.58579C7.21071 7.96086 7 8.46957 7 9C7 9.53043 7.21071 10.0391 7.58579 10.4142C7.96086 10.7893 8.46957 11 9 11H24C24.2652 11 24.5196 11.1054 24.7071 11.2929C24.8946 11.4804 25 11.7348 25 12V16M25 16H22C21.4696 16 20.9609 16.2107 20.5858 16.5858C20.2107 16.9609 20 17.4696 20 18C20 18.5304 20.2107 19.0391 20.5858 19.4142C20.9609 19.7893 21.4696 20 22 20H25C25.2652 20 25.5196 19.8946 25.7071 19.7071C25.8946 19.5196 26 19.2652 26 19V17C26 16.7348 25.8946 16.4804 25.7071 16.2929C25.5196 16.1054 25.2652 16 25 16Z' stroke='%23FF7DCB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M7 9V23C7 23.5304 7.21071 24.0391 7.58579 24.4142C7.96086 24.7893 8.46957 25 9 25H24C24.2652 25 24.5196 24.8946 24.7071 24.7071C24.8946 24.5196 25 24.2652 25 24V20' stroke='%23FF7DCB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

init();

function init(): void {
  initializeProvider();
}

function initializeProvider(): void {
  const connectionStream = new WindowPostMessageStream({
    name: `${name}:inpage`,
    target: `${name}:contentscript`,
  }) as unknown as Duplex;

  const provider = new WenProvider(connectionStream);

  setGlobalProvider(provider);

  announceProvider({
    info: {
      icon,
      name,
      rdns: 'sh.scope.wen',
      uuid: uuidv4(),
    },
    provider: provider as EIP1193Provider,
  });
}

type ExtendedWindow = Window & typeof globalThis & { ethereum: WenProvider };

function setGlobalProvider(provider: WenProvider): void {
  (window as ExtendedWindow).ethereum = provider;
  window.dispatchEvent(new Event('ethereum#initialized'));
}

export { init, initializeProvider };
