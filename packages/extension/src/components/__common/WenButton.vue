<template>
  <button
    :disabled
    :class="{
      small: size === 'small',
      medium: size === 'medium',
      large: size === 'large',
      primary: type === 'primary',
      secondary: type === 'secondary',
      ghost: type === 'ghost',
      naked: type === 'naked',
    }"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
type Size = 'small' | 'medium' | 'large';

type Type = 'primary' | 'secondary' | 'ghost' | 'naked';

const { disabled = false } = defineProps<{
  label: string;
  size: Size;
  type: Type;
  disabled?: boolean;
}>();
</script>

<style scoped>
button {
  border: none;
  border-radius: 2px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.small {
    padding: 4px;
    font-size: 12px;
  }

  &.medium {
    padding: 8px;
    font-size: 14px;
  }

  &.large {
    padding: 12px;
    font-size: 16px;
  }

  &.primary {
    background: #ff7dcb;
    color: white;
  }

  &.secondary {
    background: var(--background-secondary);
    color: var(--text);
  }

  &.ghost {
    border: 1px solid currentcolor;
    background: transparent;
    color: currentcolor;
  }

  &.naked {
    opacity: 0.6;
    background: transparent;
    color: currentcolor;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
