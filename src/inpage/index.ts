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
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTIzIDExVjhDMjMgNy43MzQ3OCAyMi44OTQ2IDcuNDgwNDMgMjIuNzA3MSA3LjI5Mjg5QzIyLjUxOTYgNy4xMDUzNiAyMi4yNjUyIDcgMjIgN0g5QzguNDY5NTcgNyA3Ljk2MDg2IDcuMjEwNzEgNy41ODU3OSA3LjU4NTc5QzcuMjEwNzEgNy45NjA4NiA3IDguNDY5NTcgNyA5QzcgOS41MzA0MyA3LjIxMDcxIDEwLjAzOTEgNy41ODU3OSAxMC40MTQyQzcuOTYwODYgMTAuNzg5MyA4LjQ2OTU3IDExIDkgMTFIMjRDMjQuMjY1MiAxMSAyNC41MTk2IDExLjEwNTQgMjQuNzA3MSAxMS4yOTI5QzI0Ljg5NDYgMTEuNDgwNCAyNSAxMS43MzQ4IDI1IDEyVjE2TTI1IDE2SDIyQzIxLjQ2OTYgMTYgMjAuOTYwOSAxNi4yMTA3IDIwLjU4NTggMTYuNTg1OEMyMC4yMTA3IDE2Ljk2MDkgMjAgMTcuNDY5NiAyMCAxOEMyMCAxOC41MzA0IDIwLjIxMDcgMTkuMDM5MSAyMC41ODU4IDE5LjQxNDJDMjAuOTYwOSAxOS43ODkzIDIxLjQ2OTYgMjAgMjIgMjBIMjVDMjUuMjY1MiAyMCAyNS41MTk2IDE5Ljg5NDYgMjUuNzA3MSAxOS43MDcxQzI1Ljg5NDYgMTkuNTE5NiAyNiAxOS4yNjUyIDI2IDE5VjE3QzI2IDE2LjczNDggMjUuODk0NiAxNi40ODA0IDI1LjcwNzEgMTYuMjkyOUMyNS41MTk2IDE2LjEwNTQgMjUuMjY1MiAxNiAyNSAxNloiIHN0cm9rZT0iI0ZGN0RDQiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTcgOVYyM0M3IDIzLjUzMDQgNy4yMTA3MSAyNC4wMzkxIDcuNTg1NzkgMjQuNDE0MkM3Ljk2MDg2IDI0Ljc4OTMgOC40Njk1NyAyNSA5IDI1SDI0QzI0LjI2NTIgMjUgMjQuNTE5NiAyNC44OTQ2IDI0LjcwNzEgMjQuNzA3MUMyNC44OTQ2IDI0LjUxOTYgMjUgMjQuMjY1MiAyNSAyNFYyMCIgc3Ryb2tlPSIjRkY3RENCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';

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
