<template>
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
      <slot name="details" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageSender } from '@/background/provider';

defineProps<{
  sender: MessageSender | null;
}>();
</script>

<style scoped>
.request {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 4px;
  background: var(--background-secondary);
  gap: 36px;
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
</style>
