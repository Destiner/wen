<template>
  <div>
    <div v-if="account">{{ account.address }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useWallet } from '@/composables/useWallet';

const wallet = useWallet();

const account = computed(() => wallet.account.value);
</script>
