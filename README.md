# wen

Ethereum Wallet for Developers

[Add to Chrome](https://chromewebstore.google.com/detail/wen/omfihmgdopplefnnekpaanlhmcffkeme)

![splash](https://github.com/user-attachments/assets/9e7d558a-7768-4666-9ad4-77981bb9abd3)

## Features

- EIP-7702 delegation designation
- ERC-5792 wallet capabilities
- ERC-7677 paymaster service

## Supported methods

- `eth_chainId`
- `eth_accounts`
- `eth_requestAccounts`
- `personal_sign`
- `eth_signTypedData_v4`
- `eth_sendTransaction`
- `wallet_getPermissions`
- `wallet_requestPermissions`
- `wallet_revokePermissions`
- `wallet_getCapabilities`
- `wallet_sendCalls`
- `wallet_getCallsStatus`
- `wallet_showCallsStatus`

### Capabilities

- `atomicBatch`
- `paymasterService`

## Packages

- Packages
  - [Extension](./packages/extension/)
- Examples
  - [Playground](./examples/playground/)

## Credits

- [EthUI](https://github.com/ethui/ethui) for the inpage <-> service worker provider communication
- [Metamask](https://github.com/metamask) for the open-source packages
- [Rainbow](https://github.com/rainbow-me) for a high bar in UX
