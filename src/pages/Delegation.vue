<template>
  <button @click="openHomePage">← Back</button>
  <div>Delegate your EOA to a smart contract</div>
  <input
    v-model="delegateeAddress"
    placeholder="Delegatee address"
    @blur="handleBlur"
  />
  <div
    v-if="!isValid && isDirty"
    class="error"
  >
    Invalid address
  </div>
  <button @click="delegate">Delegate</button>
  <div>{{ output }}</div>
</template>

<script setup lang="ts">
import { Address, Hex, isAddress } from 'viem';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useProvider } from '@/composables/useProvider';

const router = useRouter();

const { delegate: providerDelegate } = useProvider();

const delegateeAddress = ref('');
const isDirty = ref(false);

const isValid = computed(() => isAddress(delegateeAddress.value));

const output = ref('');

async function delegate(): Promise<void> {
  if (!isValid.value) {
    isDirty.value = true;
    return;
  }
  await providerDelegate(
    delegateeAddress.value as Address,
    (txHash: Hex | null) => {
      output.value = `Delegated to ${delegateeAddress.value} with tx hash ${txHash}`;
    },
  );
}

function handleBlur(): void {
  isDirty.value = true;
}

function openHomePage(): void {
  router.push({
    name: 'home',
  });
}
</script>
