import { crx } from '@crxjs/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import manifest from './manifest.config';

export default defineConfig({
  server: {
    port: 5000,
  },
  plugins: [
    tsconfigPaths({
      loose: true,
    }),
    nodePolyfills({
      exclude: ['fs'],
    }),
    vue(),
    crx({ manifest }),
  ],
});
