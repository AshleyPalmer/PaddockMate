<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from "vue";
import type { PaddockMateDB } from "../../db/paddockMateDb";
import { useTrackStore } from "../../stores/trackStore";
import PmButton from "../ui/PmButton.vue";
import PmInput from "../ui/PmInput.vue";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    defaultTrackId?: string;
  }>(),
  {
    defaultTrackId: undefined,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", payload: { trackId: string; layoutId: string }): void;
}>();

const injectedDb = inject<PaddockMateDB | undefined>("db", undefined);
const trackStore = useTrackStore(injectedDb);

type ModalMode = "new-track" | "existing-track";
const mode = ref<ModalMode>("new-track");

const form = reactive({
  trackId: "",
  trackName: "",
  country: "United Kingdom",
  layoutName: "",
  lengthMetres: "" as string | number,
});

const errors = reactive({
  trackId: "",
  trackName: "",
  layoutName: "",
});

function resetForm() {
  if (props.defaultTrackId && trackStore.getTrackById(props.defaultTrackId)) {
    mode.value = "existing-track";
    form.trackId = props.defaultTrackId;
  } else {
    mode.value = "new-track";
    form.trackId = trackStore.tracks[0]?.id ?? "";
  }
  form.trackName = "";
  form.country = "United Kingdom";
  form.layoutName = "";
  form.lengthMetres = "";
  errors.trackId = "";
  errors.trackName = "";
  errors.layoutName = "";
}

watch(
  () => [props.isOpen, props.defaultTrackId],
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
  { immediate: true }
);

const availableTracks = computed(() => trackStore.tracks);

async function handleSubmit() {
  errors.trackId = "";
  errors.trackName = "";
  errors.layoutName = "";

  let hasError = false;

  if (mode.value === "new-track") {
    if (!form.trackName.trim()) {
      errors.trackName = "Track name is required";
      hasError = true;
    }
  } else {
    if (!form.trackId) {
      errors.trackId = "Please select a track";
      hasError = true;
    }
  }

  if (!form.layoutName.trim()) {
    errors.layoutName = "Layout name is required";
    hasError = true;
  }

  if (hasError) return;

  const lengthMetresVal = form.lengthMetres ? Math.round(Number(form.lengthMetres)) : undefined;

  let trackId = form.trackId;

  if (mode.value === "new-track") {
    const createdTrack = await trackStore.addTrack({
      name: form.trackName.trim(),
      country: form.country.trim() || "United Kingdom",
    });
    trackId = createdTrack.id;
  }

  const createdLayout = await trackStore.addLayout({
    trackId,
    name: form.layoutName.trim(),
    lengthMetres: lengthMetresVal,
  });

  emit("created", { trackId, layoutId: createdLayout.id });
  emit("close");
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="custom-track-modal-title"
    @click.self="$emit('close')"
  >
    <div
      class="my-8 w-full max-w-lg rounded-2xl border border-[#2d3748] bg-[#161b22] p-6 shadow-2xl transition"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-[#2d3748] pb-4">
        <div>
          <div class="text-[10px] font-black tracking-widest text-[#d4f933] uppercase">
            CUSTOM TRACK / LAYOUT
          </div>
          <h2 id="custom-track-modal-title" class="text-xl font-black text-white">
            {{ mode === "new-track" ? "Add Custom Track" : "Add Custom Layout" }}
          </h2>
        </div>
        <button
          type="button"
          class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-[#1c2330] hover:text-white"
          aria-label="Close modal"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Mode Selector -->
      <div
        v-if="availableTracks.length > 0"
        class="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#2d3748] bg-[#0b0f17] p-1"
      >
        <button
          type="button"
          :class="[
            'min-h-[48px] cursor-pointer rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase transition',
            mode === 'new-track'
              ? 'border border-[#2d3748] bg-[#1c2330] text-[#d4f933]'
              : 'text-gray-400 hover:text-white',
          ]"
          @click="mode = 'new-track'"
        >
          New Track
        </button>
        <button
          type="button"
          :class="[
            'min-h-[48px] cursor-pointer rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase transition',
            mode === 'existing-track'
              ? 'border border-[#2d3748] bg-[#1c2330] text-[#d4f933]'
              : 'text-gray-400 hover:text-white',
          ]"
          @click="mode = 'existing-track'"
        >
          Existing Track
        </button>
      </div>

      <!-- Form Body -->
      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <!-- New Track fields -->
        <template v-if="mode === 'new-track'">
          <PmInput
            id="custom-track-name"
            v-model="form.trackName"
            label="Track Name"
            placeholder="e.g. Cadwell Park or Spa"
            :required="true"
            :error="errors.trackName"
          />
          <PmInput
            id="custom-track-country"
            v-model="form.country"
            label="Country"
            placeholder="e.g. United Kingdom"
          />
        </template>

        <!-- Existing Track field -->
        <template v-else>
          <div class="flex flex-col gap-1.5">
            <label
              for="custom-track-select"
              class="text-xs font-black tracking-wider text-gray-400 uppercase"
            >
              Select Track <span class="text-[#d4f933]">*</span>
            </label>
            <select
              id="custom-track-select"
              v-model="form.trackId"
              class="min-h-[48px] w-full rounded-xl border border-[#2d3748] bg-[#0b0f17] px-4 py-2.5 text-base font-medium text-white transition focus:border-[#d4f933] focus:ring-1 focus:ring-[#d4f933] focus:outline-none"
            >
              <option v-for="t in availableTracks" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
            <span v-if="errors.trackId" class="text-xs font-bold text-red-400">
              {{ errors.trackId }}
            </span>
          </div>
        </template>

        <!-- Layout Name & Length -->
        <PmInput
          id="custom-layout-name"
          v-model="form.layoutName"
          label="Layout Name"
          placeholder="e.g. Grand Prix, National, or Club Layout"
          :required="true"
          :error="errors.layoutName"
        />

        <PmInput
          id="custom-layout-length"
          v-model="form.lengthMetres"
          type="number"
          label="Length (Metres)"
          placeholder="e.g. 3500"
        />

        <!-- Action Buttons -->
        <div class="flex gap-3 border-t border-[#2d3748] pt-4">
          <PmButton
            type="button"
            variant="secondary"
            class="min-h-[48px] flex-1"
            @click="$emit('close')"
          >
            Cancel
          </PmButton>
          <PmButton type="submit" variant="primary" class="min-h-[48px] flex-1">
            {{ mode === "new-track" ? "Save Track ✓" : "Save Layout ✓" }}
          </PmButton>
        </div>
      </form>
    </div>
  </div>
</template>
