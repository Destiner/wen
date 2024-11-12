<template>
  <WenPage
    title="Call Request"
    subtitle="The app wants to submit calls using your account"
  >
    <template #default>
      <DetailsView :sender>
        <template #details>
          <div class="message">
            {{ formatJson(walletCallRequest) }}
          </div>
        </template>
      </DetailsView>
    </template>

    <template #footer>
      <ActionList
        @allow="allow"
        @deny="deny"
      />
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import WenPage from '@/components/__common/WenPage.vue';
import ActionList from '@/components/__common/request/ActionList.vue';
import DetailsView from '@/components/__common/request/DetailsView.vue';
import { useProvider } from '@/composables/useProvider';
import { formatJson } from '@/utils/formatting';

const {
  sender,
  walletCallRequest,
  allowWalletSendCalls: providerAllow,
  denyWalletSendCalls: providerDeny,
} = useProvider();

function allow(): void {
  providerAllow();
  window.close();
}

function deny(): void {
  providerDeny();
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
