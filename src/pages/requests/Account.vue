<template>
  <WenPage
    title="Connection Request"
    subtitle="Allow the app to access your account"
  >
    <template #default>
      <div class="request">
        <div
          v-if="sender"
          class="sender"
        >
          <div class="sender-icon">
            <img
              :src="sender.icon"
              alt="Sender icon"
            />
          </div>
          <div class="sender-origin">{{ sender.origin }}</div>
        </div>
        <div class="details">
          <ul>
            <li>Can see your wallet address</li>
          </ul>
        </div>
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

const {
  sender,
  allowAccountRequest: providerAllow,
  denyAccountRequest: providerDeny,
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
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 4px;
  background: var(--background-secondary);
  gap: 16px;
}

.sender {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sender-icon {
  --size: 48px;

  display: flex;
  flex: 0 0 var(--size);
  align-items: center;
  justify-content: center;
  width: var(--size);
  height: var(--size);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 50%;

  img {
    width: calc(var(--size) / 2);
    height: calc(var(--size) / 2);
  }
}

.sender-origin {
  flex: 1 1 auto;
  font-size: 16px;
  font-weight: 500;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 8px;

  ul {
    padding-left: 16px;
  }
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
