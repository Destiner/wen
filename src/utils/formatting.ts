import { Address } from 'viem';

function formatAddress(address: Address, length: number): string {
  return `${address.substring(0, length / 2 + 2)}...${address.substring(
    address.length - length / 2,
  )}`;
}

function formatJson(json: unknown): string {
  return JSON.stringify(json, null, 4);
}

export { formatAddress, formatJson };
