import { ref, onUnmounted } from 'vue';

interface UseTimer {
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

function useTimer(callback: () => void, duration: number): UseTimer {
  const remainingTime = ref(duration);
  const timeStarted = ref(Date.now());
  const isRunning = ref(true);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function start(): void {
    if (!isRunning.value) return;
    timeStarted.value = Date.now();

    timer = setTimeout(() => {
      callback();
    }, remainingTime.value);
  }

  function stop(): void {
    remainingTime.value -= Date.now() - timeStarted.value;
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function pause(): void {
    isRunning.value = false;
    stop();
  }

  function resume(): void {
    isRunning.value = true;
    start();
  }

  function reset(): void {
    stop();
    remainingTime.value = duration;
    isRunning.value = true;
    start();
  }

  // Start the timer automatically
  start();

  // Clean up on component unmount
  onUnmounted(() => {
    stop();
  });

  return {
    pause,
    resume,
    reset,
  };
}

export default useTimer;
