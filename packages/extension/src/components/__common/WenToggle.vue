<template>
  <div class="switch">
    <label
      v-if="label"
      class="Label"
      :for="id"
    >
      {{ label }}
    </label>
    <Switch.Root
      :id
      v-model:checked="modelValue"
      :disabled
      as="template"
      @update:model-value="handleUpdate"
    >
      <button class="root">
        <Switch.Thumb class="thumb" />
      </button>
    </Switch.Root>
  </div>
</template>

<script setup lang="ts">
import { Switch } from 'radix-vue/namespaced';
import { useId } from 'vue';

const modelValue = defineModel<boolean>({
  required: true,
});

const { label = '', disabled = false } = defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const id = useId();

function handleUpdate(value: boolean): void {
  modelValue.value = value;
}
</script>

<style scoped>
.switch {
  --border-width: 2px;
  --trigger-size: 20px;
  --travel-length: 20px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.root {
  display: inline-flex;
  position: relative;
  width: calc(
    var(--trigger-size) + var(--travel-length) + 2 * var(--border-width)
  );
  height: calc(var(--trigger-size) + 2 * var(--border-width));
  padding: 0;
  transition: color 0.2s;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
  border-width: var(--border-width);
  border-radius: calc((var(--trigger-size) + 2 * var(--border-width)) / 2);
  border-color: transparent;
  outline: none;
  outline-color: var(--border);
  outline-width: var(--border-width);
  background: var(--background-secondary);
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.root[data-state='checked'] {
  background: var(--accent);
}

.thumb {
  display: inline-block;
  width: var(--trigger-size);
  height: var(--trigger-size);
  transform: translateX(0);
  transition: all 0.2s ease-in-out;
  border-radius: 100%;
  outline: 0;
  background-color: white;
  pointer-events: none;
}

.thumb[data-state='checked'] {
  transform: translateX(var(--travel-length));
}
</style>
