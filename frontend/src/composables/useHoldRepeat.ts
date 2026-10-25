/**
 * Composable providing hold-to-repeat interaction behaviour for stepper controls.
 * Invokes callback immediately on initial press, then repeats with acceleration
 * using a 0.85 geometric decay factor on step intervals until released or cancelled.
 */
import { ref, onBeforeUnmount, getCurrentInstance } from "vue";

export interface HoldRepeatOptions {
  initialDelayMs?: number;
  stepIntervalMs?: number;
  minIntervalMs?: number;
}

export type UseHoldRepeatOptions = HoldRepeatOptions;

export function useHoldRepeat(action: () => void, options: HoldRepeatOptions = {}) {
  const initialDelay = options.initialDelayMs ?? 350;
  const baseInterval = options.stepIntervalMs ?? 120;
  const minInterval = options.minIntervalMs ?? 40;

  const isHolding = ref(false);
  let initialTimer: ReturnType<typeof setTimeout> | null = null;
  let repeatTimer: ReturnType<typeof setTimeout> | null = null;
  let currentInterval = baseInterval;

  function step() {
    action();
    currentInterval = Math.max(minInterval, currentInterval * 0.85);
    repeatTimer = setTimeout(step, currentInterval);
  }

  function stop() {
    isHolding.value = false;
    if (initialTimer !== null) {
      clearTimeout(initialTimer);
      initialTimer = null;
    }
    if (repeatTimer !== null) {
      clearTimeout(repeatTimer);
      repeatTimer = null;
    }
  }

  function start(event?: Event) {
    if (
      event &&
      "button" in event &&
      (event as PointerEvent).button !== 0 &&
      (event as PointerEvent).button !== undefined
    ) {
      return;
    }
    if (event && "preventDefault" in event) {
      event.preventDefault();
    }
    stop();
    isHolding.value = true;
    currentInterval = baseInterval;
    action();

    initialTimer = setTimeout(() => {
      step();
    }, initialDelay);
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      stop();
    });
  }

  return {
    isHolding,
    start,
    stop,
    handlers: {
      pointerdown: start,
      pointerup: stop,
      pointerleave: stop,
      pointercancel: stop,
      contextmenu: (e: Event) => e.preventDefault(),
    },
  };
}
