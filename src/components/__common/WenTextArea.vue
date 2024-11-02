<template>
  <div class="root">
    <div class="main">
      <label
        v-if="label"
        :for="id"
      >
        {{ label }}
      </label>
      <textarea
        :id
        v-model="modelValue"
        :placeholder
        :class="{ error: !isValid }"
        @blur="handleBlur"
      />
    </div>
    <div
      v-if="!isValid && errorText"
      class="error-text"
    >
      {{ errorText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

const modelValue = defineModel<string>({
  required: true,
});

const {
  label = '',
  placeholder = '',
  isValid = true,
  errorText = '',
} = defineProps<{
  label?: string;
  placeholder?: string;
  isValid?: boolean;
  errorText?: string;
}>();

const emit = defineEmits<{
  blur: [];
}>();

const id = useId();

function handleBlur(): void {
  emit('blur');
}
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

textarea {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid rgba(from var(--accent) r g b / 60%);
  border-radius: 8px;
  outline: none;
  background: var(--background-secondary);
  color: var(--text-primary);
  font-size: 16px;
  resize: none;
  field-sizing: content;

  &:focus {
    border-color: var(--accent);
  }

  &.error {
    border-color: var(--text-error);
  }
}

.error-text {
  color: var(--text-error);
  font-size: 12px;
}
</style>
