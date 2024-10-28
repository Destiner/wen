<template>
  <div>
    <div v-if="account">{{ account.address }}</div>
    <button @click="openDelegationPage">Delegate</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useWallet } from '@/composables/useWallet';

const router = useRouter();

const wallet = useWallet();

const account = computed(() => wallet.account.value);

function openDelegationPage(): void {
  router.push({
    name: 'delegation',
  });
}
</script>
