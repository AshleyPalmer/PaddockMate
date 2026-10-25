<script setup lang="ts">
import { useHoldRepeat } from "../../composables/useHoldRepeat";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    step?: number;
    min?: number;
    max?: number;
    unit?: string;
    decimals?: number;
  }>(),
  {
    step: 0.5,
    min: 0,
    max: 100,
    unit: "PSI",
    decimals: 1,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

function adjust(delta: number) {
  const next = Number(
    Math.min(props.max, Math.max(props.min, props.modelValue + delta)).toFixed(props.decimals)
  );
  if (next !== props.modelValue) {
    emit("update:modelValue", next);
    if (
      typeof globalThis !== "undefined" &&
      "navigator" in globalThis &&
      typeof (globalThis.navigator as Navigator | undefined)?.vibrate === "function"
    ) {
      (globalThis.navigator as Navigator).vibrate(8);
    }
  }
}

const dec = useHoldRepeat(() => adjust(-props.step));
const inc = useHoldRepeat(() => adjust(props.step));
</script>

<template>
  <div
    class="flex items-center justify-between rounded-xl border border-[#2d3748] bg-[#0b0f17] p-2"
  >
    <button
      type="button"
      class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-[#1c2330] text-2xl font-black text-white transition select-none active:scale-90 active:bg-white active:text-black"
      aria-label="Decrease value"
      v-on="dec.handlers"
      @keydown.enter.prevent="adjust(-props.step)"
      @keydown.space.prevent="adjust(-props.step)"
    >
      −
    </button>
    <div class="text-center font-mono">
      <span class="text-2xl font-black text-white">{{ modelValue.toFixed(decimals) }}</span>
      <span v-if="unit" class="ml-1 text-xs font-bold text-gray-400">{{ unit }}</span>
    </div>
    <button
      type="button"
      class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-[#1c2330] text-2xl font-black text-white transition select-none active:scale-90 active:bg-white active:text-black"
      aria-label="Increase value"
      v-on="inc.handlers"
      @keydown.enter.prevent="adjust(props.step)"
      @keydown.space.prevent="adjust(props.step)"
    >
      +
    </button>
  </div>
</template>
