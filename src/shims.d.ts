import { EIP1193Provider } from 'viem';

declare module '*.vue' {
  import { ComponentOptions } from 'vue';

  const component: ComponentOptions;
  export default component;
}

interface Window {
  ethereum?: EIP1193Provider;
}
