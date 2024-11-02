<template>
  <div
    class="root"
    :class="{
      info: type === 'info',
      warning: type === 'warning',
    }"
  >
    <slot />
    <slot name="append" />
  </div>
</template>

<script setup lang="ts">
type Type = 'info' | 'warning';

defineProps<{
  type: Type;
}>();
</script>

<style scoped>
.root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 2px;

  &.info {
    background: #e0f7fa;
    color: #00acc1;
  }

  &.warning {
    background: #222017;
    color: #e67400;
  }
}
</style>
