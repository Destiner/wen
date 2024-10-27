<template>
  {{ transaction }}
  <button @click="allow">allow</button>
  <button @click="deny">deny</button>
</template>

<script setup lang="ts">
import { useProvider } from '@/composables/useProvider';

const {
  transaction,
  allowSendTransaction: providerAllow,
  denySendTransaction: providerDeny,
} = useProvider();

function allow(): void {
  providerAllow();
  window.close();
}

function deny(): void {
  providerDeny();
  window.close();
}
</script>
