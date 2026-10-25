<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from "vue";
import type { LayoutEntity, PaddockMateDB, TrackEntity } from "../../db/paddockMateDb";
import { useTrackStore } from "../../stores/trackStore";
import PmButton from "../ui/PmButton.vue";
import CustomTrackModal from "./CustomTrackModal.vue";

const props = withDefaults(
  defineProps<{
    selectedTrackId?: string;
    selectedLayoutId?: string;
    modelValue?: { trackId: string; layoutId: string } | null;
  }>(),
  {
    selectedTrackId: undefined,
    selectedLayoutId: undefined,
    modelValue: null,
  }
);

const emit = defineEmits<{
  (e: "select", trackId: string, layoutId: string): void;
  (e: "update:selectedTrackId", trackId: string): void;
  (e: "update:selectedLayoutId", layoutId: string): void;
  (e: "update:modelValue", value: { trackId: string; layoutId: string }): void;
}>();

const injectedDb = inject<PaddockMateDB | undefined>("db", undefined);
const trackStore = useTrackStore(injectedDb);

const searchQuery = ref("");
const expandedTrackId = ref<string | null>(
  props.selectedTrackId ?? props.modelValue?.trackId ?? null
);
const activeTrackId = ref<string | null>(
  props.selectedTrackId ?? props.modelValue?.trackId ?? null
);
const activeLayoutId = ref<string | null>(
  props.selectedLayoutId ?? props.modelValue?.layoutId ?? null
);
const isCustomModalOpen = ref(false);

onMounted(async () => {
  if (trackStore.tracks.length === 0) {
    await trackStore.fetchTracks();
  }
  if (trackStore.layouts.length === 0) {
    await trackStore.fetchLayouts();
  }
});

watch(
  () => props.selectedTrackId,
  (val) => {
    if (val !== undefined) {
      activeTrackId.value = val;
      if (val) expandedTrackId.value = val;
    }
  }
);

watch(
  () => props.selectedLayoutId,
  (val) => {
    if (val !== undefined) {
      activeLayoutId.value = val;
    }
  }
);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      activeTrackId.value = val.trackId;
      activeLayoutId.value = val.layoutId;
      expandedTrackId.value = val.trackId;
    }
  }
);

const UK_TRACK_REGIONS: Record<string, string> = {
  "Anglesey Circuit": "WALES",
  "Bedford Autodrome": "BEDFORDSHIRE",
  "Brands Hatch": "KENT",
  "Cadwell Park": "LINCOLNSHIRE",
  "Castle Combe": "WILTSHIRE",
  Croft: "NORTH YORKSHIRE",
  "Donington Park": "LEICESTERSHIRE",
  Goodwood: "WEST SUSSEX",
  Knockhill: "SCOTLAND",
  "Oulton Park": "CHESHIRE",
  Silverstone: "NORTHAMPTONSHIRE",
  Snetterton: "NORFOLK",
  Thruxton: "HAMPSHIRE",
};

const LAYOUT_TURNS: Record<string, number> = {
  "Silverstone Grand Prix": 18,
  "Silverstone National": 6,
  "Silverstone International": 10,
  "Brands Hatch Grand Prix": 9,
  "Brands Hatch Indy": 6,
  "Donington Park Grand Prix": 12,
  "Donington Park National": 10,
  "Cadwell Park Full Circuit": 18,
  "Cadwell Park Club": 11,
  "Cadwell Park Woodlands": 7,
  "Oulton Park International": 17,
  "Oulton Park Island": 11,
  "Oulton Park Fosters": 7,
  "Snetterton 300": 12,
  "Snetterton 200": 8,
  "Anglesey Circuit International": 11,
  "Anglesey Circuit Coastal": 10,
  "Anglesey Circuit National": 6,
  "Anglesey Circuit Club": 4,
  "Croft Full Circuit": 12,
  "Croft Club Circuit A": 7,
  "Croft Club Circuit B": 6,
  "Goodwood Full Circuit": 7,
  "Thruxton Full Circuit": 11,
  "Castle Combe Full Circuit": 8,
  "Bedford Autodrome GT": 19,
  "Bedford Autodrome SEN": 10,
  "Knockhill International": 9,
  "Knockhill National": 8,
};

function getTrackRegion(track: TrackEntity): string {
  const region = UK_TRACK_REGIONS[track.name];
  const countryCode = track.country === "United Kingdom" ? "GB" : track.country.toUpperCase();
  if (region) {
    return `${countryCode} / ${region}`;
  }
  return countryCode;
}

function getLayouts(trackId: string): LayoutEntity[] {
  return trackStore.getLayoutsForTrack(trackId);
}

function formatLayoutCount(count: number): string {
  const padded = String(count).padStart(2, "0");
  return `${padded} ${count === 1 ? "LAYOUT" : "LAYOUTS"}`;
}

function formatLayoutInfo(trackName: string, layout: LayoutEntity): string {
  const parts: string[] = [];
  if (layout.lengthMetres) {
    const km = (layout.lengthMetres / 1000).toFixed(2);
    parts.push(`${km} km`);
  }
  const key = `${trackName} ${layout.name}`;
  const turns = LAYOUT_TURNS[key];
  if (turns !== undefined) {
    parts.push(`${turns} turns`);
  }
  return parts.join(" · ");
}

const filteredTracks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return trackStore.tracks;
  }
  return trackStore.tracks.filter((track) => {
    const nameMatch = track.name.toLowerCase().includes(query);
    const countryMatch = track.country.toLowerCase().includes(query);
    const region = UK_TRACK_REGIONS[track.name]?.toLowerCase() ?? "";
    const regionMatch = region.includes(query);
    return nameMatch || countryMatch || regionMatch;
  });
});

function toggleTrack(trackId: string) {
  if (expandedTrackId.value === trackId) {
    expandedTrackId.value = null;
  } else {
    expandedTrackId.value = trackId;
  }
}

function selectLayout(trackId: string, layoutId: string) {
  activeTrackId.value = trackId;
  activeLayoutId.value = layoutId;
  expandedTrackId.value = trackId;
  emit("select", trackId, layoutId);
  emit("update:selectedTrackId", trackId);
  emit("update:selectedLayoutId", layoutId);
  emit("update:modelValue", { trackId, layoutId });
}

function handleCustomCreated(payload: { trackId: string; layoutId: string }) {
  selectLayout(payload.trackId, payload.layoutId);
}
</script>

<template>
  <div class="space-y-4" data-testid="track-selector">
    <!-- Search Bar & Add Button -->
    <div class="space-y-3">
      <div class="relative flex items-center">
        <!-- Magnifying Glass Icon -->
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <!-- Search Input -->
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search track or location"
          class="min-h-[48px] w-full rounded-xl border border-[#2d3748] bg-[#0b0f17] pr-12 pl-11 text-base font-medium text-white transition placeholder:text-gray-500 focus:border-[#d4f933] focus:ring-1 focus:ring-[#d4f933] focus:outline-none"
          aria-label="Search track or location"
        />

        <!-- Clear Search Button -->
        <button
          v-if="searchQuery"
          type="button"
          class="absolute inset-y-0 right-0 flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center text-gray-400 hover:text-white"
          aria-label="Clear search"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Add Custom Track Button -->
      <PmButton
        type="button"
        variant="secondary"
        class="min-h-[48px] w-full"
        @click="isCustomModalOpen = true"
      >
        <span class="text-[#d4f933]">+</span> Add Custom Track or Layout
      </PmButton>
    </div>

    <!-- Track List Section Header -->
    <div
      class="flex items-center justify-between text-xs font-black tracking-wider text-gray-400 uppercase"
    >
      <span>OFFLINE TRACKS</span>
      <span>{{ filteredTracks.length }} AVAILABLE</span>
    </div>

    <!-- Track List -->
    <div v-if="filteredTracks.length > 0" class="space-y-3">
      <div
        v-for="track in filteredTracks"
        :key="track.id"
        :data-testid="'track-card-' + track.id"
        :class="[
          'overflow-hidden rounded-2xl border transition',
          activeTrackId === track.id
            ? 'border-[#d4f933] bg-[#161b22] ring-1 ring-[#d4f933]'
            : 'border-[#2d3748] bg-[#161b22] hover:border-[#4b5563]',
        ]"
      >
        <!-- Track Accordion Button -->
        <button
          type="button"
          class="flex min-h-[48px] w-full cursor-pointer items-center justify-between p-4 text-left transition select-none"
          :aria-expanded="expandedTrackId === track.id"
          @click="toggleTrack(track.id)"
        >
          <div class="space-y-1">
            <div class="text-[11px] font-black tracking-widest text-[#d4f933] uppercase">
              {{ getTrackRegion(track) }}
            </div>
            <h3 class="text-lg font-black tracking-tight text-white">
              {{ track.name.toUpperCase() }}
            </h3>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="rounded-lg border border-[#2d3748] bg-[#1c2330] px-2.5 py-1 text-xs font-bold text-gray-400"
            >
              {{ formatLayoutCount(getLayouts(track.id).length) }}
            </span>
            <div
              :class="[
                'flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-transform duration-200',
                expandedTrackId === track.id ? 'rotate-180 text-white' : '',
              ]"
              aria-hidden="true"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </button>

        <!-- Layouts Expanded Section -->
        <div
          v-if="expandedTrackId === track.id"
          class="space-y-1.5 border-t border-[#2d3748] bg-[#0f141c] p-2"
          role="radiogroup"
          :aria-label="`${track.name} Layouts`"
        >
          <button
            v-for="layout in getLayouts(track.id)"
            :key="layout.id"
            type="button"
            role="radio"
            :aria-checked="activeLayoutId === layout.id"
            :data-testid="'layout-option-' + layout.id"
            :class="[
              'flex min-h-[48px] w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-left transition select-none',
              activeLayoutId === layout.id
                ? 'border border-[#d4f933]/60 bg-[#1c2330] text-white ring-1 ring-[#d4f933]/40'
                : 'border border-transparent bg-transparent text-gray-300 hover:bg-[#161b22] hover:text-white',
            ]"
            @click="selectLayout(track.id, layout.id)"
          >
            <!-- Left: Radio button + Layout name -->
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
                  activeLayoutId === layout.id
                    ? 'border-[#d4f933] bg-transparent'
                    : 'border-[#4b5563] bg-transparent',
                ]"
              >
                <div
                  v-if="activeLayoutId === layout.id"
                  class="h-3 w-3 rounded-full bg-[#d4f933]"
                />
              </div>
              <span class="text-sm font-bold tracking-wide">
                {{ layout.name }}
              </span>
            </div>

            <!-- Right: Length & turns info -->
            <div class="text-right text-xs font-semibold text-gray-400">
              {{ formatLayoutInfo(track.name, layout) }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Search State -->
    <div
      v-else
      class="rounded-2xl border border-dashed border-[#2d3748] bg-[#161b22]/50 p-8 text-center"
    >
      <div class="text-sm font-bold text-gray-400">
        No tracks found matching "{{ searchQuery }}"
      </div>
      <p class="mt-1 text-xs text-gray-500">
        Try another search term or add a custom track facility.
      </p>
      <PmButton
        type="button"
        variant="secondary"
        class="mt-4 min-h-[48px]"
        @click="isCustomModalOpen = true"
      >
        + Add Custom Track or Layout
      </PmButton>
    </div>

    <!-- Custom Track Modal -->
    <CustomTrackModal
      :is-open="isCustomModalOpen"
      :default-track-id="activeTrackId ?? expandedTrackId ?? undefined"
      @close="isCustomModalOpen = false"
      @created="handleCustomCreated"
    />
  </div>
</template>
