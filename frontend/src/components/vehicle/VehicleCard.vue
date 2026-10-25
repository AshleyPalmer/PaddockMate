<script setup lang="ts">
import { computed } from "vue";
import type { VehicleEntity } from "../../db/paddockMateDb";
import PmCard from "../ui/PmCard.vue";

const props = withDefaults(
  defineProps<{
    vehicle: VehicleEntity;
    selected?: boolean;
  }>(),
  {
    selected: false,
  }
);

defineEmits<{
  (e: "select", vehicle: VehicleEntity): void;
  (e: "edit", vehicle: VehicleEntity): void;
}>();

const title = computed(() => {
  if (props.vehicle.nickname?.trim()) {
    return props.vehicle.nickname.toUpperCase();
  }
  return `${props.vehicle.make} ${props.vehicle.model}`.toUpperCase();
});

const fittedTyreSizes = computed(() => {
  const front = props.vehicle.frontTyreSize?.trim();
  const rear = props.vehicle.rearTyreSize?.trim();
  if (front && rear) {
    return `F ${front} / R ${rear}`;
  }
  if (front) {
    return `F ${front}`;
  }
  if (rear) {
    return `R ${rear}`;
  }
  return undefined;
});
</script>

<template>
  <PmCard
    :selected="selected"
    class="relative cursor-pointer transition hover:border-[#4b5563]"
    @click="$emit('select', vehicle)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 space-y-3">
        <!-- Title & Badges -->
        <div>
          <div class="font-mono text-lg font-black tracking-wide text-white">
            {{ title }}
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              v-if="vehicle.chassis"
              class="inline-flex items-center rounded border border-[#2d3748] bg-[#1c2330] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-gray-300 uppercase"
            >
              {{ vehicle.chassis.toUpperCase() }}
            </span>
            <span
              v-else-if="vehicle.year"
              class="inline-flex items-center rounded border border-[#2d3748] bg-[#1c2330] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-gray-300 uppercase"
            >
              {{ vehicle.year }}
            </span>
            <span
              v-if="vehicle.drivetrain"
              class="inline-flex items-center rounded border border-[#2d3748] bg-[#1c2330] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#d4f933] uppercase"
            >
              {{ vehicle.drivetrain }}
            </span>
            <span
              v-if="vehicle.fuel"
              class="inline-flex items-center rounded border border-[#2d3748] bg-[#1c2330] px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-gray-300 uppercase"
            >
              {{ vehicle.fuel.toUpperCase() }}
            </span>
          </div>
        </div>

        <!-- Fitted Tyres -->
        <div class="rounded-xl border border-[#2d3748]/60 bg-[#0b0f17]/60 p-2.5">
          <div class="text-[10px] font-black tracking-widest text-gray-400 uppercase">
            FITTED TYRES
          </div>
          <div class="mt-0.5 text-sm font-semibold text-white">
            {{ vehicle.tyreModel || "Standard Track Tyres" }}
          </div>
          <div v-if="fittedTyreSizes" class="mt-0.5 font-mono text-xs text-gray-400">
            {{ fittedTyreSizes }}
          </div>
        </div>

        <!-- Action / Edit vehicle -->
        <div class="pt-1">
          <button
            type="button"
            class="inline-flex min-h-[48px] cursor-pointer items-center px-2 py-3 text-xs font-bold text-gray-400 underline decoration-dotted transition hover:text-[#d4f933]"
            @click.stop="$emit('edit', vehicle)"
          >
            Edit vehicle
          </button>
        </div>
      </div>

      <!-- Radio Selection Indicator -->
      <div
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition"
        :class="[
          selected
            ? 'border-[#d4f933] bg-[#d4f933] text-black'
            : 'border-[#2d3748] bg-transparent text-transparent',
        ]"
        aria-label="Selection indicator"
      >
        <span class="text-xs font-black">✓</span>
      </div>
    </div>
  </PmCard>
</template>
