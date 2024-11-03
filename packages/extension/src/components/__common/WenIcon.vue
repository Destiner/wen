<template>
  <IconCopy v-if="kind === 'copy'" />
  <IconChevronDown v-else-if="kind === 'chevron-down'" />
  <IconChevronUp v-else-if="kind === 'chevron-up'" />
</template>

<script setup lang="ts">
import IconChevronDown from './icons/general/ChevronDown.vue';
import IconChevronUp from './icons/general/ChevronUp.vue';
import IconCopy from './icons/general/Copy.vue';
import type { Kind } from './icons/general/index';

defineProps<{
  kind: Kind;
}>();
</script>
