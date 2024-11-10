const TOAST_DURATION = 5 * 1000;

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export { TOAST_DURATION };
export type { Toast };
