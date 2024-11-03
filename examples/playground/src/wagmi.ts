import { http, createConfig } from '@wagmi/vue';
import { odysseyTestnet } from '@wagmi/vue/chains';

const config = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
});

// eslint-disable-next-line import-x/prefer-default-export
export { config };
