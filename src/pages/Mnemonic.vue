<template>
  <div class="root">
    <button @click="openHomePage">← Back</button>
    <h1>Edit mnemonic</h1>
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
      @click="save"
    >
      Save
    </button>
  </div>
</template>

<script setup lang="ts">
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useWallet } from '@/composables/useWallet';

const router = useRouter();

const { getMnemonic: getWalletMnemonic, setMnemonic: setWalletMnemonic } =
  useWallet();

const input = ref('');
const isDirty = ref(false);

const isValid = computed(() => validateMnemonic(input.value, wordlist));

onMounted(() => {
  getMnemonic();
});

async function getMnemonic(): Promise<void> {
  const walletMnemonic = await getWalletMnemonic();
  if (walletMnemonic) {
    input.value = walletMnemonic;
  }
}

async function save(): Promise<void> {
  isDirty.value = true;
  if (!isValid.value) {
    return;
  }
  await setWalletMnemonic(input.value);
  openHomePage();
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
  color: var(--text-error);
  font-size: 13px;
}
</style>
