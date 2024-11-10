<template>
  <IconCheckCircled v-if="kind === 'check-circled'" />
  <IconChevronDown v-else-if="kind === 'chevron-down'" />
  <IconChevronUp v-else-if="kind === 'chevron-up'" />
  <IconCopy v-else-if="kind === 'copy'" />
  <IconCrossCircled v-else-if="kind === 'cross-circled'" />
</template>

<script setup lang="ts">
import IconCheckCircled from './icons/general/CheckCircled.vue';
import IconChevronDown from './icons/general/ChevronDown.vue';
import IconChevronUp from './icons/general/ChevronUp.vue';
import IconCopy from './icons/general/Copy.vue';
import IconCrossCircled from './icons/general/CrossCircled.vue';
import type { Kind } from './icons/general/index';

defineProps<{
  kind: Kind;
}>();
</script>
