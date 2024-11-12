<template>
  <button
    :class="{ primary: type === 'primary' }"
    :disabled
  >
    <span class="chrome">
      <span class="content">
        <slot />
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
const { type, disabled = false } = defineProps<{
  type: 'primary' | 'secondary';
  disabled?: boolean;
}>();
</script>

<style scoped>
button {
  padding: 0;
  padding-block: 0;
  padding-inline: 0;
  border-width: 0;
  background-color: rgb(0 0 0 / 0%);
  color: rgb(17 17 17);
  font-size: 14px;
  cursor: pointer;

  --chrome: #e1dddd;
  --border-top: #ccc;
  --border-bottom: #ccc;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.primary {
    --chrome: #eb2ab1;
    --border-top: #b1169a;
    --border-bottom: #b1169a;

    &:hover {
      --border-top: #8e0372;
    }
  }

  .chrome {
    display: flex;
    position: relative;
    box-sizing: border-box;
    flex: 1 0 0%;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    height: 36px;
    padding: 2.5px 12px 5.5px;
    gap: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: rgb(0 0 0 / 0%);

    &::before {
      content: '';
      position: absolute;
      inset: -1px;
      box-sizing: border-box;
      border-width: 1px;
      border-style: solid;
      border-radius: 6px;
      border-color: var(--border-bottom);
    }

    &::after {
      content: '';
      position: absolute;
      inset: -1px -1px 2px;
      box-sizing: border-box;
      transition: opacity 0.2s ease 0s;
      border-width: 1px;
      border-style: solid;
      border-radius: 6px;
      border-color: var(--border-top);
      box-shadow: var(--chrome) 0 3px 0 -1px;
    }
  }

  &:hover {
    --border-top: #aaa;

    .chrome {
      transform: translateY(-1px);

      &::before {
        bottom: -2px;
      }

      &::after {
        box-shadow: var(--chrome) 0 4px 0 -1px;
      }
    }
  }

  &:active {
    .chrome {
      transform: translateY(1px);

      &::before {
        bottom: 0;
      }

      &::after {
        box-shadow: var(--chrome) 0 2px 0 -1px;
      }
    }
  }
}
</style>
