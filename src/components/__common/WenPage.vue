<template>
  <div class="page">
    <div class="main">
      <slot name="header" />
      <div
        v-if="title || subtitle"
        class="panel"
      >
        <div
          v-if="title"
          class="title"
        >
          {{ title }}
        </div>
        <div
          v-if="subtitle"
          class="subtitle"
        >
          {{ subtitle }}
        </div>
      </div>
      <div class="content">
        <slot />
      </div>
    </div>
    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { title = '', subtitle = '' } = defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 16px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 400;
  text-align: center;
}

.panel {
  display: flex;
  gap: 4px;
  flex-direction: column;
}

.panel:first-child {
  margin-top: 24px;
}

.footer {
  display: flex;
  gap: 16px;
  flex-direction: column;
}
</style>
