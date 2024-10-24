import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { WagmiPlugin } from '@wagmi/vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHashHistory, createRouter } from 'vue-router';

import AccountRequest from '@/pages/AccountRequest.vue';
import Home from '@/pages/Home.vue';
import Import from '@/pages/Import.vue';
import { config } from '@/wagmi';

import App from './App.vue';

const routerHistory = createWebHashHistory();
const router = createRouter({
  history: routerHistory,
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/import', name: 'import', component: Import },
    {
      path: '/account-request',
      name: 'account-request',
      component: AccountRequest,
    },
  ],
});

const pinia = createPinia();

const queryClient = new QueryClient();

const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(WagmiPlugin, { config })
  .use(VueQueryPlugin, { queryClient });

app.mount('#app');

export { routerHistory, router };
