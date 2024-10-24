import type { Duplex } from 'node:stream';

import {
  JsonRpcEngine,
  createIdRemapMiddleware,
} from '@metamask/json-rpc-engine';
import { createStreamMiddleware } from '@metamask/json-rpc-middleware-stream';
import type {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import { EthereumRpcError } from 'eth-rpc-errors';
import { EventEmitter } from 'eventemitter3';
import { Address } from 'viem';

class WenProvider extends EventEmitter {
  protected initialized = false;
  protected autoId = 0;
  protected engine: JsonRpcEngine;
  protected stream: Duplex;

  /**
   * @param connectionStream - A Node.js duplex stream
   */
  constructor(stream: Duplex) {
    super();
    this.bindFunctions();
    this.stream = stream;
    this.engine = new JsonRpcEngine();
  }

  private bindFunctions(): void {
    this.request = this.request.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    this.initialize = this.initialize.bind(this);
    this.nextId = this.nextId.bind(this);
  }

  public async request({
    method,
    params,
  }: Pick<
    JsonRpcRequest<JsonRpcParams>,
    'method' | 'params'
  >): Promise<unknown> {
    this.initialize();
    const resp: JsonRpcResponse<Json> = await this.engine.handle({
      method,
      params,
      id: this.nextId(),
      jsonrpc: '2.0',
    });

    if ('error' in resp) {
      throw resp.error;
    }

    if (Array.isArray(resp)) {
      return resp;
    } else {
      return resp.result;
    }
  }

  protected handleConnect(chainId: string): void {
    this.emit('connect', { chainId });
  }

  protected handleDisconnect(errorMessage: string): void {
    const error = new EthereumRpcError(
      1011, // Internal error
      errorMessage,
    );

    this.emit('disconnect', error);
  }

  protected handleChainChanged({ chainId }: { chainId: string }): void {
    this.handleConnect(chainId);
    this.emit('chainChanged', chainId);
  }

  protected handleAccountsChanged(accounts: Address[]): void {
    this.emit('accountsChanged', accounts);
  }

  protected enable(): Promise<unknown> {
    console.warn(
      "wen: enable is deprecated. Use request({ method: 'eth_requestAccounts' }) instead.",
    );
    return this.request({ method: 'eth_requestAccounts', params: [] });
  }

  protected initialize(): void {
    if (this.initialized) {
      return;
    }

    const connection = createStreamMiddleware();
    connection.stream.pipe(this.stream).pipe(connection.stream);

    this.engine.push(createIdRemapMiddleware());
    this.engine.push(connection.middleware);

    // Handle JSON-RPC notifications
    connection.events.on('notification', ({ method, params }) => {
      switch (method) {
        case 'accountsChanged':
          this.handleAccountsChanged(params);
          break;

        case 'chainChanged':
          this.handleChainChanged(params);
          break;

        case 'METAMASK_STREAM_FAILURE':
          this.stream.destroy(
            new Error(
              'wen: Disconnected from wen background. Page reload required.',
            ),
          );
          break;

        default:
          if (method === 'eth_subscription') {
            this.emit('message', {
              type: method,
              data: params,
            });
          }
      }
    });

    this.initialized = true;
  }

  private nextId(): string {
    this.autoId++;
    return `auto-${this.autoId}`;
  }
}

// eslint-disable-next-line import-x/prefer-default-export
export { WenProvider };
