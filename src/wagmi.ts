import { http, createConfig } from '@wagmi/vue';
import { base, baseSepolia, mainnet, sepolia } from '@wagmi/vue/chains';

const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// eslint-disable-next-line import-x/prefer-default-export
export { config };
