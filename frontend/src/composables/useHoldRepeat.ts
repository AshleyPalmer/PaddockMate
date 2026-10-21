/**
 * Composable for hold-to-repeat interaction behaviour.
 * Triggers an immediate invocation on press, then continues repeating after an initial delay,
 * optionally accelerating after a given number of repetitions.
 */

export interface UseHoldRepeatOptions {
  /** Delay in milliseconds before repeating begins */
  initialDelayMs?: number
  /** Interval in milliseconds between repeat ticks */
  repeatIntervalMs?: number
  /** Accelerated interval in milliseconds after threshold is reached */
  acceleratedIntervalMs?: number
  /** Number of repeat ticks before switching to accelerated interval */
  accelerationThreshold?: number
}

export function useHoldRepeat(
  callback: () => void,
  options: UseHoldRepeatOptions = {}
) {
  const {
    initialDelayMs = 350,
    repeatIntervalMs = 80,
    acceleratedIntervalMs = 40,
    accelerationThreshold = 10,
  } = options

  let delayTimer: ReturnType<typeof setTimeout> | null = null
  let repeatTimer: ReturnType<typeof setTimeout> | null = null
  let tickCount = 0

  function stop() {
    if (delayTimer !== null) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    if (repeatTimer !== null) {
      clearTimeout(repeatTimer)
      repeatTimer = null
    }
    tickCount = 0
  }

  function start() {
    stop()
    callback()
    tickCount = 0

    function scheduleNext() {
      const interval =
        tickCount >= accelerationThreshold
          ? acceleratedIntervalMs
          : repeatIntervalMs

      repeatTimer = setTimeout(() => {
        callback()
        tickCount++
        scheduleNext()
      }, interval)
    }

    delayTimer = setTimeout(() => {
      scheduleNext()
    }, initialDelayMs)
  }

  function onPointerDown(event: PointerEvent) {
    // Only respond to primary click / touch
    if (event.button !== 0 && event.button !== undefined) {
      return
    }
    start()
  }

  return {
    start,
    stop,
    handlers: {
      pointerdown: onPointerDown,
      pointerup: stop,
      pointerleave: stop,
      pointercancel: stop,
      contextmenu: (e: Event) => e.preventDefault(),
    },
  }
}
