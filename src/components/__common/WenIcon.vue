<template>
  <IconCopy v-if="kind === 'copy'" />
</template>

<script setup lang="ts">
import IconCopy from './icons/general/Copy.vue';
import type { Kind } from './icons/general/index';

defineProps<{
  kind: Kind;
}>();
</script>
