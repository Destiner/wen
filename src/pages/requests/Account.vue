<template>
  <WenPage
    title="Connection Request"
    subtitle="Allow the app to access your account"
  >
    <template #default> </template>

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

const { allowAccountRequest: providerAllow, denyAccountRequest: providerDeny } =
  useProvider();

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
