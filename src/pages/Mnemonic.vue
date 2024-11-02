<template>
  <WenPage title="Change Mnemonic">
    <template #header>
      <div>
        <WenButton
          type="naked"
          size="small"
          label="← Back"
          @click="openHomePage"
        />
      </div>
    </template>
    <template #default>
      <WenTextArea
        v-model="mnemonicInput"
        label="Seed Phrase"
        placeholder="12-word phrase"
        :is-valid="isValid"
        error-text="Invalid mnemonic"
        @blur="handleInputBlur"
      />
    </template>

    <template #footer>
      <WenInfoBlock type="warning">
        <template #default>
          This wallet is optimized for developer experience, not security. Do
          NOT use it for accounts with large mainnet funds.
        </template>
      </WenInfoBlock>
      <WenButton
        type="primary"
        size="large"
        label="Save"
        :disabled="!hasMnemonic"
        @click="store"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import WenButton from '@/components/__common/WenButton.vue';
import WenInfoBlock from '@/components/__common/WenInfoBlock.vue';
import WenPage from '@/components/__common/WenPage.vue';
import WenTextArea from '@/components/__common/WenTextArea.vue';
import { useWallet } from '@/composables/useWallet';

const router = useRouter();

const { getMnemonic: getWalletMnemonic, setMnemonic: setWalletMnemonic } =
  useWallet();

const mnemonicInput = ref('');
const isDirty = ref(false);

const hasMnemonic = computed(() =>
  validateMnemonic(mnemonicInput.value, wordlist),
);
const isValid = computed(() => !isDirty.value || hasMnemonic.value);

onMounted(() => {
  getMnemonic();
});

async function getMnemonic(): Promise<void> {
  const walletMnemonic = await getWalletMnemonic();
  if (walletMnemonic) {
    mnemonicInput.value = walletMnemonic;
  }
}

async function store(): Promise<void> {
  isDirty.value = true;
  if (!isValid.value) {
    return;
  }
  setWalletMnemonic(mnemonicInput.value);
}

function handleInputBlur(): void {
  isDirty.value = true;
}

function openHomePage(): void {
  router.push({
    name: 'home',
  });
}
</script>
