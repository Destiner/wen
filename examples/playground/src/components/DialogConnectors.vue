<template>
  <Dialog.Root v-model:open="open">
    <Dialog.Portal>
      <Dialog.Overlay class="overlay" />
      <Dialog.Content class="content">
        <div class="connectors">
          <div
            v-for="connector in connectors"
            :key="connector.name"
            class="connector"
            @click="() => handleClick(connector)"
          >
            <img
              v-if="connector.icon"
              :src="connector.icon"
              class="icon"
            />
            <div
              v-else
              class="icon"
            />
            {{ connector.name }}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</template>

<script setup lang="ts">
import type { Connector } from '@wagmi/core';
import { useConnectors } from '@wagmi/vue';
import { Dialog } from 'radix-vue/namespaced';

const open = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  select: [value: Connector];
}>();

const connectors = useConnectors();

function handleClick(connector: Connector): void {
  emit('select', connector);
  open.value = false;
}
</script>

<style scoped>
.overlay {
  position: fixed;
  background: #00000080;
  inset: 0;
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 25px;
  transform: translate(-50%, -50%);
  border-radius: 6px;
  background-color: white;
  box-shadow:
    hsl(206deg 22% 7% / 35%) 0 10px 38px -10px,
    hsl(206deg 22% 7% / 20%) 0 10px 20px -15px;
}

.content:focus {
  outline: none;
}

.connectors {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connector {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  gap: 16px;

  &:hover {
    border-radius: 6px;
    background-color: #f2f2f2;
  }
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
