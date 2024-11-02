<template>
  <WenPage
    title="Permission Request"
    subtitle="Allow the app to access your account"
  >
    <template #default>
      <div class="request">
        {{ formatJson(permissionRequest) }}
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <div class="action">
          <WenButton
            type="primary"
            size="large"
            label="Allow"
            @click="allow"
          />
        </div>
        <div class="action">
          <WenButton
            type="secondary"
            size="large"
            label="Decline"
            @click="deny"
          />
        </div>
      </div>
    </template>
  </WenPage>
</template>

<script setup lang="ts">
import WenButton from '@/components/__common/WenButton.vue';
import WenPage from '@/components/__common/WenPage.vue';
import { useProvider } from '@/composables/useProvider';
import { formatJson } from '@/utils/formatting';

const {
  permissionRequest,
  allowRequestPermissions: providerAllow,
  denyRequestPermissions: providerDeny,
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
.request {
  padding: 16px;
  overflow-x: auto;
  background: var(--background-secondary);
  font-family: var(--font-mono);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.actions {
  display: flex;
  gap: 16px;
}

.action {
  display: flex;
  flex: 1;
  flex-direction: column;
}
</style>
