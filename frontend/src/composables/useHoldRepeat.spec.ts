import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useHoldRepeat } from './useHoldRepeat'

describe('useHoldRepeat composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers callback immediately on start', () => {
    const callback = vi.fn()
    const { start } = useHoldRepeat(callback)

    start()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('does not repeat before initial delay passes', () => {
    const callback = vi.fn()
    const { start } = useHoldRepeat(callback, { initialDelayMs: 350, repeatIntervalMs: 80 })

    start()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('repeats callback at regular interval after initial delay', () => {
    const callback = vi.fn()
    const { start } = useHoldRepeat(callback, { initialDelayMs: 350, repeatIntervalMs: 80 })

    start()
    expect(callback).toHaveBeenCalledTimes(1)

    // After 350ms, the repeating timer starts
    vi.advanceTimersByTime(350 + 80)
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(80)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('stops repeating when stop is invoked', () => {
    const callback = vi.fn()
    const { start, stop } = useHoldRepeat(callback, { initialDelayMs: 350, repeatIntervalMs: 80 })

    start()
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(350 + 80)
    expect(callback).toHaveBeenCalledTimes(2)

    stop()

    vi.advanceTimersByTime(500)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('accelerates repeat interval after reaching acceleration threshold', () => {
    const callback = vi.fn()
    const { start } = useHoldRepeat(callback, {
      initialDelayMs: 350,
      repeatIntervalMs: 80,
      acceleratedIntervalMs: 40,
      accelerationThreshold: 2,
    })

    start() // tick 0 (immediate)
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(350 + 80) // tick 1
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(80) // tick 2 (reached threshold 2)
    expect(callback).toHaveBeenCalledTimes(3)

    // Next tick should now only require 40ms instead of 80ms
    vi.advanceTimersByTime(40)
    expect(callback).toHaveBeenCalledTimes(4)
  })

  it('exposes DOM pointer event handlers that manage repeat lifecycle', () => {
    const callback = vi.fn()
    const { handlers } = useHoldRepeat(callback, { initialDelayMs: 300, repeatIntervalMs: 50 })

    const pointerDownEvent = { button: 0 } as PointerEvent
    handlers.pointerdown(pointerDownEvent)
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300 + 50)
    expect(callback).toHaveBeenCalledTimes(2)

    handlers.pointerup()
    vi.advanceTimersByTime(200)
    expect(callback).toHaveBeenCalledTimes(2)

    // Secondary click (e.g. right-click) should not trigger
    const rightClickEvent = { button: 2 } as PointerEvent
    handlers.pointerdown(rightClickEvent)
    expect(callback).toHaveBeenCalledTimes(2)

    // Context menu prevention
    const contextMenuEvent = { preventDefault: vi.fn() } as unknown as MouseEvent
    handlers.contextmenu(contextMenuEvent)
    expect(contextMenuEvent.preventDefault).toHaveBeenCalled()
  })
})
