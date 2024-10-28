<template>
  <div>
    <div v-if="walletAddress">{{ walletAddress }}</div>
    <div v-if="balance">{{ formatEther(balance) }} ETH</div>
    <div v-if="delegation">Delegating to {{ delegation }}</div>
    <button @click="openDelegationPage">Delegate</button>
    <button @click="openMnemonicPage">Edit mnemonic</button>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import {
  Address,
  createPublicClient,
  formatEther,
  http,
  size,
  slice,
} from 'viem';
import { getBalance, getCode } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useWallet } from '@/composables/useWallet';

const DELEGATION_HEADER = '0xef0100';

const router = useRouter();

const wallet = useWallet();

const walletAddress = computed(() => wallet.address.value);

const balance = ref<bigint | null>(null);
const delegation = ref<Address | null>(null);
useIntervalFn(
  () => {
    fetchBalance();
    fetchDelegation();
  },
  10 * 1000,
  {
    immediate: true,
    immediateCallback: true,
  },
);
async function fetchBalance(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const accountBalance = await getBalance(client, {
    address: walletAddress.value,
  });
  balance.value = accountBalance;
}
async function fetchDelegation(): Promise<void> {
  if (!walletAddress.value) {
    return;
  }
  const client = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const code = await getCode(client, {
    address: walletAddress.value,
  });
  delegation.value =
    code === undefined
      ? null
      : slice(code, 0, size(DELEGATION_HEADER)) === DELEGATION_HEADER
        ? slice(code, size(DELEGATION_HEADER))
        : null;
}

function openDelegationPage(): void {
  router.push({
    name: 'delegation',
  });
}

function openMnemonicPage(): void {
  router.push({
    name: 'mnemonic',
  });
}
</script>
