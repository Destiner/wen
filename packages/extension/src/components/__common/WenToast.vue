<template>
  <Transition name="slide-fade">
    <div
      v-if="value"
      ref="el"
      class="root"
    >
      <div
        class="toast"
        :class="{
          error: value.type === 'error',
          success: value.type === 'success',
        }"
        @click="hide"
      >
        <WenIcon
          :kind="value.type === 'success' ? 'check-circled' : 'cross-circled'"
          class="icon"
        />
        <div class="content">
          <span class="message">{{ value.message }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useElementHover } from '@vueuse/core';
import { useTemplateRef, watch } from 'vue';

import WenIcon from '@/components/__common/WenIcon.vue';
import useTimerFn from '@/composables/useTimerFn';
import { useToast } from '@/composables/useToast';
import type { Toast } from '@/utils/ui';
import { TOAST_DURATION } from '@/utils/ui';

const { value } = defineProps<{
  value: Toast | null;
}>();

const el = useTemplateRef('el');
const isHovered = useElementHover(el);

const { hide } = useToast();

watch(isHovered, (value) => {
  if (value) {
    pause();
  } else {
    resume();
  }
});
watch(
  () => value,
  (value) => {
    if (value) {
      reset();
    }
  },
);

const { pause, resume, reset } = useTimerFn(() => {
  hide();
}, TOAST_DURATION);
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.15, 0.74, 0.61, 0.84);
}

.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.15, 0.74, 0.61, 0.84);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(24px);
  opacity: 0;
}

.root {
  --toast-height: 32px;
  --gap: 8px;
  --width: 200px;

  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 4px;
  border-radius: var(--border-radius-m);

  &.expanded {
    height: calc(var(--toast-height));
  }
}

.toast {
  --icon-size: 20px;
  --icon-close-size: 14px;
  --toast-padding: 12px;
  --item-gap: 6px;
  --item-height: 32px;
  --gap: 8px;

  display: flex;
  position: fixed;
  z-index: 10;
  bottom: 48px;
  align-items: center;
  justify-content: space-between;
  max-width: var(--width);
  height: var(--item-height);
  margin: 4px;
  padding: var(--toast-padding);
  border: 1px solid var(--border);
  border-radius: 4px;
  background: oklch(from var(--color-background-primary) l c h / 60%);
  gap: var(--item-gap);
  cursor: pointer;

  &.success {
    background: #1a2526;
    color: #4caf50;
  }

  &.error {
    background: #221417;
    color: #f44336;
  }
}

.content {
  display: flex;
  align-items: center;
  gap: var(--item-gap);
}

.icon {
  width: var(--icon-size);
  height: var(--icon-size);
}

.message {
  max-width: calc(
    var(--width) - var(--icon-size) - var(--icon-close-size) - var(--item-gap) -
      var(--item-gap) - 2 * var(--toast-padding)
  );
  font-size: 14px;
}

.icon-close {
  width: var(--icon-close-size);
  height: var(--icon-close-size);
  opacity: 0;
  cursor: pointer;
}

.toast:hover .icon-close {
  opacity: 0.8;
}

.toast:hover .icon-close:hover {
  opacity: 1;
}
</style>
