import { Address } from 'viem';

function formatAddress(address: Address, length: number): string {
  return `${address.substring(0, length / 2 + 2)}...${address.substring(
    address.length - length / 2,
  )}`;
}

// eslint-disable-next-line import-x/prefer-default-export
export { formatAddress };
