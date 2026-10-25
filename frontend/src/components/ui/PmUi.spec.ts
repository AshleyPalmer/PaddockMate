import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import PmButton from "./PmButton.vue";
import PmCard from "./PmCard.vue";
import PmStepper from "./PmStepper.vue";
import PmInput from "./PmInput.vue";

describe("Tactile UI Primitives", () => {
  describe("PmButton", () => {
    it("renders PmButton with primary neon styling and triggers click", async () => {
      const wrapper = mount(PmButton, {
        props: { variant: "primary" },
        slots: { default: "Start Track Day" },
      });
      expect(wrapper.text()).toContain("Start Track Day");
      expect(wrapper.classes()).toContain("bg-[#d4f933]");
      await wrapper.trigger("click");
      expect(wrapper.emitted("click")).toBeTruthy();
    });

    it("renders secondary, outline, and danger variants", () => {
      const secondaryWrapper = mount(PmButton, {
        props: { variant: "secondary" },
      });
      expect(secondaryWrapper.classes()).toContain("bg-[#1c2330]");

      const outlineWrapper = mount(PmButton, {
        props: { variant: "outline" },
      });
      expect(outlineWrapper.classes()).toContain("bg-transparent");

      const dangerWrapper = mount(PmButton, {
        props: { variant: "danger" },
      });
      expect(dangerWrapper.classes()).toContain("bg-red-600");
    });

    it("respects disabled state and prevents click event emission", async () => {
      const wrapper = mount(PmButton, {
        props: { disabled: true },
        slots: { default: "Disabled Action" },
      });
      expect(wrapper.attributes("disabled")).toBeDefined();
      expect(wrapper.classes()).toContain("disabled:opacity-50");
      await wrapper.trigger("click");
      expect(wrapper.emitted("click")).toBeFalsy();
    });
  });

  describe("PmCard", () => {
    it("renders slot content and default unselected borders", () => {
      const wrapper = mount(PmCard, {
        slots: { default: "<p>Card Content</p>" },
      });
      expect(wrapper.text()).toContain("Card Content");
      expect(wrapper.classes()).toContain("border-[#2d3748]");
      expect(wrapper.classes()).not.toContain("border-[#d4f933]");
    });

    it("applies electric lime border and ring when selected", () => {
      const wrapper = mount(PmCard, {
        props: { selected: true },
        slots: { default: "<span>Selected Vehicle</span>" },
      });
      expect(wrapper.text()).toContain("Selected Vehicle");
      expect(wrapper.classes()).toContain("border-[#d4f933]");
      expect(wrapper.classes()).toContain("ring-[#d4f933]");
    });
  });

  describe("PmStepper", () => {
    const vibrateMock = vi.fn();

    beforeEach(() => {
      vibrateMock.mockClear();
      Object.defineProperty(navigator, "vibrate", {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });
    });

    it("renders PmStepper and emits update:modelValue on increment/decrement", async () => {
      const wrapper = mount(PmStepper, {
        props: { modelValue: 28.0, step: 0.5, min: 10, max: 50 },
      });
      expect(wrapper.text()).toContain("28.0");
      expect(wrapper.text()).toContain("PSI");
      const buttons = wrapper.findAll("button");
      expect(buttons).toHaveLength(2);

      // Decrement button (first)
      await buttons[0].trigger("pointerdown");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([27.5]);

      // Increment button (second)
      await buttons[1].trigger("pointerdown");
      expect(wrapper.emitted("update:modelValue")?.[1]).toEqual([28.5]);
    });

    it("respects min and max clamping boundaries without redundant emissions or vibration", async () => {
      const minWrapper = mount(PmStepper, {
        props: { modelValue: 10.0, step: 1.0, min: 10.0, max: 20.0 },
      });
      const minButtons = minWrapper.findAll("button");
      await minButtons[0].trigger("pointerdown");
      expect(minWrapper.emitted("update:modelValue")).toBeUndefined();
      expect(vibrateMock).not.toHaveBeenCalled();

      const maxWrapper = mount(PmStepper, {
        props: { modelValue: 20.0, step: 1.0, min: 10.0, max: 20.0 },
      });
      const maxButtons = maxWrapper.findAll("button");
      await maxButtons[1].trigger("pointerdown");
      expect(maxWrapper.emitted("update:modelValue")).toBeUndefined();
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it("supports keyboard accessibility with Enter and Space keys", async () => {
      const wrapper = mount(PmStepper, {
        props: { modelValue: 28.0, step: 0.5, min: 10, max: 50 },
      });
      const buttons = wrapper.findAll("button");

      await buttons[0].trigger("keydown.enter");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([27.5]);

      await buttons[0].trigger("keydown.space");
      expect(wrapper.emitted("update:modelValue")?.[1]).toEqual([27.5]);

      await buttons[1].trigger("keydown.enter");
      expect(wrapper.emitted("update:modelValue")?.[2]).toEqual([28.5]);

      await buttons[1].trigger("keydown.space");
      expect(wrapper.emitted("update:modelValue")?.[3]).toEqual([28.5]);
    });

    it("triggers haptic vibration if supported when value changes", async () => {
      const wrapper = mount(PmStepper, {
        props: { modelValue: 30.0 },
      });
      const buttons = wrapper.findAll("button");
      await buttons[1].trigger("pointerdown");
      expect(vibrateMock).toHaveBeenCalledWith(8);
    });
  });

  describe("PmInput", () => {
    it("renders PmInput with label and emits update:modelValue", async () => {
      const wrapper = mount(PmInput, {
        props: { modelValue: "BMW", label: "Make" },
      });
      expect(wrapper.text()).toContain("Make");
      const input = wrapper.find("input");
      await input.setValue("Porsche");
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["Porsche"]);
    });

    it("displays required asterisk indicator when required is true", () => {
      const wrapper = mount(PmInput, {
        props: { modelValue: "", label: "Model", required: true },
      });
      expect(wrapper.find("label").text()).toContain("*");
    });

    it("displays validation error message and applies error styles", () => {
      const wrapper = mount(PmInput, {
        props: {
          modelValue: "",
          label: "Registration",
          error: "Registration is required",
        },
      });
      expect(wrapper.text()).toContain("Registration is required");
      const input = wrapper.find("input");
      expect(input.classes()).toContain("border-red-500");
    });

    it("passes standard attributes directly to the input element and associates label with id", () => {
      const wrapper = mount(PmInput, {
        props: { modelValue: "user@example.com", label: "Email Address" },
        attrs: { id: "email-input", autocomplete: "email", spellcheck: "false" },
      });
      expect(wrapper.attributes("id")).toBeUndefined();
      const input = wrapper.find("input");
      expect(input.attributes("id")).toBe("email-input");
      expect(input.attributes("autocomplete")).toBe("email");
      expect(input.attributes("spellcheck")).toBe("false");
      const label = wrapper.find("label");
      expect(label.attributes("for")).toBe("email-input");
    });
  });
});
