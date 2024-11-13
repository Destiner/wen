<template>
  <WenPage title="Call Status">
    <template #default>
      <div class="message">
        {{ formatJson(walletCallsStatus) }}
      </div>
    </template>

    <template #footer>
      <WenButton
        type="secondary"
        label="Close"
        size="large"
        @click="close"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import WenButton from '@/components/__common/WenButton.vue';
import WenPage from '@/components/__common/WenPage.vue';
import { useProvider } from '@/composables/useProvider';
import { formatJson } from '@/utils/formatting';

const { walletCallsStatus } = useProvider();

function close(): void {
  window.close();
}
</script>

<style scoped>
.message {
  max-height: 300px;
  overflow-y: auto;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
