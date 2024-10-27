import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { WagmiPlugin } from '@wagmi/vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHashHistory, createRouter } from 'vue-router';

import Home from '@/pages/Home.vue';
import Import from '@/pages/Import.vue';
import AccountRequest from '@/pages/requests/Account.vue';
import PersonalSign from '@/pages/requests/PersonalSign.vue';
import SendTransaction from '@/pages/requests/SendTransaction.vue';
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
    {
      path: '/personal-sign',
      name: 'personal-sign',
      component: PersonalSign,
    },
    {
      path: '/send-transaction',
      name: 'send-transaction',
      component: SendTransaction,
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
