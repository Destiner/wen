<template>
  <div class="actions">
    <div class="action">
      <WenButton
        type="primary"
        size="large"
        label="Allow"
        @click="clickAllow"
      />
    </div>
    <div class="action">
      <WenButton
        type="secondary"
        size="large"
        label="Decline"
        @click="clickDeny"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import WenButton from '@/components/__common/WenButton.vue';

const emit = defineEmits<{
  allow: [];
  deny: [];
}>();

function clickAllow(): void {
  emit('allow');
}

function clickDeny(): void {
  emit('deny');
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
