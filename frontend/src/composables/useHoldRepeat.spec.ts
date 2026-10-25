import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { useHoldRepeat } from "./useHoldRepeat";

describe("useHoldRepeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("triggers immediate action on start", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action);

    handlers.pointerdown({ preventDefault: vi.fn() } as unknown as PointerEvent);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("accelerates repeat rate when held down", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action, {
      initialDelayMs: 400,
      stepIntervalMs: 100,
      accelerationIntervalMs: 50,
      minIntervalMs: 30,
    });

    handlers.pointerdown({ preventDefault: vi.fn() } as unknown as PointerEvent);
    expect(action).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(400);
    expect(action).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(100);
    expect(action).toHaveBeenCalledTimes(3);

    handlers.pointerup();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(3);
  });

  it("stops repeating on pointerleave", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action, { initialDelayMs: 300, stepIntervalMs: 100 });

    handlers.pointerdown();
    expect(action).toHaveBeenCalledTimes(1);

    handlers.pointerleave();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("stops repeating on pointercancel", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action, { initialDelayMs: 300, stepIntervalMs: 100 });

    handlers.pointerdown();
    expect(action).toHaveBeenCalledTimes(1);

    handlers.pointercancel();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("supports programmatic start and stop invocations", () => {
    const action = vi.fn();
    const { start, stop } = useHoldRepeat(action, { initialDelayMs: 250, stepIntervalMs: 80 });

    start();
    expect(action).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(action).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("tracks isHolding reactive status correctly", () => {
    const action = vi.fn();
    const { isHolding, handlers } = useHoldRepeat(action);

    expect(isHolding.value).toBe(false);

    handlers.pointerdown();
    expect(isHolding.value).toBe(true);

    handlers.pointerup();
    expect(isHolding.value).toBe(false);
  });

  it("ignores secondary clicks such as right clicks", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action);

    const rightClickEvent = { button: 2, preventDefault: vi.fn() } as unknown as PointerEvent;
    handlers.pointerdown(rightClickEvent);

    expect(action).not.toHaveBeenCalled();
    expect(rightClickEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("prevents default context menu action", () => {
    const action = vi.fn();
    const { handlers } = useHoldRepeat(action);

    const preventDefault = vi.fn();
    handlers.contextmenu({ preventDefault } as unknown as MouseEvent);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("cleans up active timers when component unmounts", () => {
    const action = vi.fn();
    const TestComponent = defineComponent({
      setup() {
        const { handlers } = useHoldRepeat(action, {
          initialDelayMs: 200,
          stepIntervalMs: 100,
        });
        return { handlers };
      },
      template: '<button v-on="handlers">Hold me</button>',
    });

    const wrapper = mount(TestComponent);
    wrapper.find("button").trigger("pointerdown");
    expect(action).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    vi.advanceTimersByTime(500);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
