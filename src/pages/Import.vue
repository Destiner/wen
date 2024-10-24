<template>
  <div class="root">
    <h1>Import your wallet</h1>
    <input
      v-model="input"
      @blur="handleBlur"
    />
    <div
      v-if="!isValid && isDirty"
      class="error"
    >
      Invalid seed phrase
    </div>
    <button
      :disabled="!isValid"
      @click="store"
    >
      Import
    </button>
  </div>
</template>

<script setup lang="ts">
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { computed, ref } from 'vue';

import { useWallet } from '@/composables/useWallet';

const { setMnemonic: setWalletMnemonic } = useWallet();

const input = ref('');
const isDirty = ref(false);

const isValid = computed(() => validateMnemonic(input.value, wordlist));

async function store(): Promise<void> {
  isDirty.value = true;
  if (!isValid.value) {
    return;
  }
  setWalletMnemonic(input.value);
}

function handleBlur(): void {
  isDirty.value = true;
}
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

input {
  width: 100%;
}

.error {
  color: tomato;
  font-size: 13px;
}
</style>
