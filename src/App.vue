<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import '@fontsource-variable/inter';
import { RouterView } from 'vue-router';

import { useRouting } from '@/composables/useRouting';

useRouting();
</script>

<!-- eslint-disable-next-line vue/enforce-style-attribute -->
<style>
:root {
  --text-primary: #fafafa;
  --text-secondary: #c4c4c4;
  --text-error: tomato;
  --background-primary: #000;
  --background-secondary: #1b1b1b;
  --border: #333;
  --accent: #ff7dcb;
  --font-sans: 'Inter Variable', -apple-system, 'BlinkMacSystemFont',
    avenir next, avenir, segoe ui, helvetica neue, helvetica, 'Ubuntu', roboto,
    noto, arial, sans-serif;
  --font-serif: 'Iowan Old Style', 'Apple Garamond', 'Baskerville',
    'Times New Roman', 'Droid Serif', 'Times', 'Source Serif Pro', serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  --font-mono: 'Menlo', 'Consolas', 'Monaco', 'Liberation Mono',
    'Lucida Console', monospace;
}

body {
  width: 340px;
  height: 600px;
  margin: 0;
  padding: 0;
  background: var(--background-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

/* Reset */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  height: 100%;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

#app {
  isolation: isolate;
  height: 100%;
}
</style>
