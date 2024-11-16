import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createWebHashHistory, createRouter } from 'vue-router';

import Delegation from '@/pages/Delegation.vue';
import Home from '@/pages/Home.vue';
import Import from '@/pages/Import.vue';
import Mnemonic from '@/pages/Mnemonic.vue';
import AccountRequest from '@/pages/requests/Account.vue';
import Permissions from '@/pages/requests/Permissions.vue';
import PersonalSign from '@/pages/requests/PersonalSign.vue';
import SendTransaction from '@/pages/requests/SendTransaction.vue';
import SignTypedData from '@/pages/requests/SignTypedData.vue';
import WalletCallsStatus from '@/pages/requests/WalletCallsStatus.vue';
import WalletSendCalls from '@/pages/requests/WalletSendCalls.vue';

import App from './App.vue';

const routerHistory = createWebHashHistory();
const router = createRouter({
  history: routerHistory,
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/import', name: 'import', component: Import },
    { path: '/delegation', name: 'delegation', component: Delegation },
    { path: '/mnemonic', name: 'mnemonic', component: Mnemonic },
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
    {
      path: '/sign-typed-data',
      name: 'sign-typed-data',
      component: SignTypedData,
    },
    {
      path: '/request-permissions',
      name: 'request-permissions',
      component: Permissions,
    },
    {
      path: '/wallet-send-calls',
      name: 'wallet-send-calls',
      component: WalletSendCalls,
    },
    {
      path: '/wallet-calls-status',
      name: 'wallet-calls-status',
      component: WalletCallsStatus,
    },
  ],
});

const pinia = createPinia();

const app = createApp(App).use(router).use(pinia);

app.mount('#app');

export { routerHistory, router };
