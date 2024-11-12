<template>
  <Select.Root
    :model-value="modelValue"
    @update:model-value="handleModelValueUpdate"
  >
    <Select.Trigger
      as-child
      :aria-label="placeholder"
      :disabled
    >
      <button class="trigger">
        <Select.Value
          as="div"
          class="value"
          :placeholder="placeholder"
        >
          <slot name="trigger">
            {{ selectedLabel }}
          </slot>
        </Select.Value>
        <WenIcon
          class="icon"
          kind="chevron-down"
        />
      </button>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content
        :side-offset="4"
        position="popper"
      >
        <div class="panel">
          <Select.ScrollUpButton class="scroll-button">
            <WenIcon kind="chevron-up" />
          </Select.ScrollUpButton>

          <Select.Viewport>
            <Select.Group>
              <Select.Item
                v-for="(item, index) in options"
                :key="index"
                class="item"
                :value="item.value"
              >
                <slot
                  name="item"
                  :item
                >
                  {{ item.label }}
                </slot>
              </Select.Item>
            </Select.Group>
          </Select.Viewport>

          <Select.ScrollDownButton class="scroll-button">
            <WenIcon kind="chevron-down" />
          </Select.ScrollDownButton>
        </div>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</template>

<script setup lang="ts">
import { Select } from 'radix-vue/namespaced';
import { computed } from 'vue';

import WenIcon from '@/components/__common/WenIcon.vue';

const model = defineModel<Option['value']>({
  required: true,
});

const {
  options,
  placeholder,
  disabled = false,
} = defineProps<{
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}>();

function handleModelValueUpdate(newValue: string): void {
  model.value = newValue;
}

const selectedLabel = computed(() => {
  const selectedOption = options.find((option) => option.value === model.value);
  return selectedOption?.label ?? placeholder;
});
</script>

<script lang="ts">
interface Option {
  value: string;
  label: string;
}

// eslint-disable-next-line import-x/prefer-default-export
export type { Option };
</script>

<style scoped>
.trigger {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--accent);
  border-radius: 8px;
  outline: none;
  background: var(--background-secondary);
  color: var(--text-primary);
  font-size: 16px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.icon {
  width: 16px;
  height: 16px;
}

.panel {
  display: flex;
  justify-content: space-between;
  width: var(--radix-select-trigger-width);
  padding: 8px 6px;
  animation: scale-in 0.125s ease-out;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--background-primary);
}

@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scroll-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 25px;
  cursor: default;
}

.item {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: var(--background-secondary);
  }
}
</style>
