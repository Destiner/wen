import { defineStore } from 'pinia';
import { ref } from 'vue';

import { type Toast } from '@/utils/ui.js';

const store = defineStore('ui', () => {
  const toast = ref<Toast | null>(null);

  function setToast(newToast: Toast): void {
    toast.value = newToast;
  }

  function removeToast(): void {
    toast.value = null;
  }

  return {
    toast,
    setToast,
    removeToast,
  };
});

export default store;
