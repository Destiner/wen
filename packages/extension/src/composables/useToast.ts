import type { Ref } from 'vue';
import { onMounted, ref, watch } from 'vue';

import useUiStore from '@/stores/ui.js';
import type { Toast } from '@/utils/ui.js';

interface UseToast {
  item: Ref<Toast | null>;
  send: (toast: Toast) => void;
  hide: () => void;
}

function useToast(): UseToast {
  const item = ref<Toast | null>(null);
  const store = useUiStore();

  onMounted(() => {
    item.value = store.toast;

    watch(
      () => store.toast,
      (newToast) => {
        item.value = newToast;
      },
    );
  });

  function send(toast: Toast): void {
    store.setToast(toast);
  }

  function hide(): void {
    store.removeToast();
  }

  return { item, send, hide };
}

// eslint-disable-next-line import-x/prefer-default-export
export { useToast };
