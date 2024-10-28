<template>
  <div>
    <div v-if="account">{{ account.address }}</div>
    <div v-if="balance">{{ formatEther(balance) }} ETH</div>
    <button @click="openDelegationPage">Delegate</button>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import { createPublicClient, formatEther, http } from 'viem';
import { getBalance } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useWallet } from '@/composables/useWallet';

const router = useRouter();

const wallet = useWallet();

const account = computed(() => wallet.account.value);

const balance = ref<bigint | null>(null);
useIntervalFn(
  () => {
    fetchBalance();
  },
  10 * 1000,
  {
    immediate: true,
    immediateCallback: true,
  },
);
async function fetchBalance(): Promise<void> {
  if (!account.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const accountBalance = await getBalance(client, {
    address: account.value.address,
  });
  balance.value = accountBalance;
}

function openDelegationPage(): void {
  router.push({
    name: 'delegation',
  });
}
</script>
