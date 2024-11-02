<template>
  <button :disabled>{{ label }}</button>
</template>

<script setup lang="ts">
const { disabled = false } = defineProps<{
  label: string;
  disabled?: boolean;
}>();
</script>

<style scoped>
button {
  padding: 12px;
  border: none;
  border-radius: 2px;
  background: #ff7dcb;
  color: white;
  font-size: 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
