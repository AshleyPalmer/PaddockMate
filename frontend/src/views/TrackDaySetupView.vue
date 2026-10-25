<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import TrackSelector from "../components/setup/TrackSelector.vue";
import PmButton from "../components/ui/PmButton.vue";
import PmInput from "../components/ui/PmInput.vue";
import PmStepper from "../components/ui/PmStepper.vue";
import type { PaddockMateDB } from "../db/paddockMateDb";
import { useTrackDayStore } from "../stores/trackDayStore";
import { useTrackStore } from "../stores/trackStore";
import { useTyreReadingStore } from "../stores/tyreReadingStore";
import { useVehicleStore } from "../stores/vehicleStore";

const router = useRouter();
const injectedDb = inject<PaddockMateDB | undefined>("db", undefined);
const vehicleStore = useVehicleStore(injectedDb);
const trackStore = useTrackStore(injectedDb);
const trackDayStore = useTrackDayStore(injectedDb);
const tyreReadingStore = useTyreReadingStore(injectedDb);

// Wizard navigation: Step 2 (Track Selector), Step 3 (Track Day initialisation)
const currentStep = ref<number>(3);

// Track & Layout selection
const selectedTrackId = ref<string>("");
const selectedLayoutId = ref<string>("");

// Date in British format DD / MM / YYYY
function formatTodayBritishDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day} / ${month} / ${year}`;
}

function parseBritishDateToIso(britishDate: string): string {
  const parts = britishDate.replace(/\s+/g, "").split(/[/.-]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
}

const dateInput = ref<string>(formatTodayBritishDate());
const ambientTemperature = ref<number | undefined>(18);
const isSubmitting = ref<boolean>(false);

// 4-Corner Cold Start Pressures (PSI)
const coldFl = ref<number>(28.0);
const coldFr = ref<number>(28.0);
const coldRl = ref<number>(27.0);
const coldRr = ref<number>(27.0);

// Axle Hot Target Pressures (PSI)
const targetFront = ref<number>(32.0);
const targetRear = ref<number>(31.0);

const activeVehicle = computed(() => vehicleStore.activeVehicle);

const selectedTrack = computed(() => {
  if (!selectedTrackId.value) return undefined;
  return trackStore.getTrackById(selectedTrackId.value);
});

const selectedLayout = computed(() => {
  if (!selectedLayoutId.value) return undefined;
  return trackStore.getLayoutById(selectedLayoutId.value);
});

const pressureUnit = computed(() => activeVehicle.value?.pressureUnit ?? "PSI");

// Predicted thermal growth deltas
const frontThermalGrowth = computed(() => {
  const avgCold = (coldFl.value + coldFr.value) / 2;
  const delta = targetFront.value - avgCold;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} ${pressureUnit.value}`;
});

const rearThermalGrowth = computed(() => {
  const avgCold = (coldRl.value + coldRr.value) / 2;
  const delta = targetRear.value - avgCold;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} ${pressureUnit.value}`;
});

function syncPressuresFromVehicle() {
  const vehicle = activeVehicle.value;
  if (!vehicle) return;

  if (vehicle.defaultColdPressureFl !== undefined) coldFl.value = vehicle.defaultColdPressureFl;
  if (vehicle.defaultColdPressureFr !== undefined) coldFr.value = vehicle.defaultColdPressureFr;
  if (vehicle.defaultColdPressureRl !== undefined) coldRl.value = vehicle.defaultColdPressureRl;
  if (vehicle.defaultColdPressureRr !== undefined) coldRr.value = vehicle.defaultColdPressureRr;

  if (vehicle.defaultTargetPressureFl !== undefined) {
    targetFront.value = vehicle.defaultTargetPressureFl;
  }
  if (vehicle.defaultTargetPressureRl !== undefined) {
    targetRear.value = vehicle.defaultTargetPressureRl;
  }
}

watch(
  () => activeVehicle.value,
  (vehicle) => {
    if (vehicle) {
      syncPressuresFromVehicle();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (vehicleStore.vehicles.length === 0) {
    await vehicleStore.fetchVehicles();
  }
  if (!vehicleStore.activeVehicleId && vehicleStore.vehicles.length > 0) {
    vehicleStore.setActiveVehicle(vehicleStore.vehicles[0].id);
  }
  syncPressuresFromVehicle();

  if (trackStore.tracks.length === 0) {
    await trackStore.fetchTracks();
  }
  if (trackStore.layouts.length === 0) {
    await trackStore.fetchLayouts();
  }

  // Pre-select first available track and layout if none chosen yet
  if (!selectedTrackId.value && trackStore.tracks.length > 0) {
    const firstTrack = trackStore.tracks[0];
    selectedTrackId.value = firstTrack.id;
    const layouts = trackStore.getLayoutsForTrack(firstTrack.id);
    if (layouts.length > 0) {
      selectedLayoutId.value = layouts[0].id;
    }
  }
});

function handleTrackSelect(trackId: string, layoutId: string) {
  selectedTrackId.value = trackId;
  selectedLayoutId.value = layoutId;
  currentStep.value = 3;
}

function goToGarage() {
  router.push("/vehicles");
}

async function handleStartTrackDay() {
  if (!activeVehicle.value || !selectedTrackId.value || !selectedLayoutId.value) {
    return;
  }

  isSubmitting.value = true;
  try {
    const isoDate = parseBritishDateToIso(dateInput.value);
    const ambientTemp =
      ambientTemperature.value !== undefined &&
      ambientTemperature.value !== null &&
      !isNaN(Number(ambientTemperature.value))
        ? Number(ambientTemperature.value)
        : undefined;

    // 1. Create Track Day
    const trackDay = await trackDayStore.createTrackDay({
      vehicleId: activeVehicle.value.id,
      trackId: selectedTrackId.value,
      layoutId: selectedLayoutId.value,
      date: isoDate,
      ambientTemperature: ambientTemp,
    });

    // 2. Create Session 1
    const session = await trackDayStore.createSession({
      trackDayId: trackDay.id,
      sessionNumber: 1,
    });

    // 3. Seed baseline Tyre Readings for all 4 corners
    await Promise.all([
      tyreReadingStore.saveReading({
        sessionId: session.id,
        corner: "FL",
        coldPressure: coldFl.value,
        targetPressure: targetFront.value,
      }),
      tyreReadingStore.saveReading({
        sessionId: session.id,
        corner: "FR",
        coldPressure: coldFr.value,
        targetPressure: targetFront.value,
      }),
      tyreReadingStore.saveReading({
        sessionId: session.id,
        corner: "RL",
        coldPressure: coldRl.value,
        targetPressure: targetRear.value,
      }),
      tyreReadingStore.saveReading({
        sessionId: session.id,
        corner: "RR",
        coldPressure: coldRr.value,
        targetPressure: targetRear.value,
      }),
    ]);

    // 4. Transition to Session 1 tyre monitoring view
    await router.push(`/track-days/${trackDay.id}/session/1`);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white" data-testid="track-day-setup-view">
    <main class="mx-auto max-w-2xl px-4 py-8 pb-32">
      <!-- Wizard Step Header -->
      <nav aria-label="Wizard progress" class="mb-6">
        <div class="flex items-center justify-between gap-2 border-b border-[#2d3748] pb-4">
          <!-- Step 1: Vehicle -->
          <button
            type="button"
            data-testid="wizard-step-1"
            class="flex min-h-[48px] items-center gap-1.5 px-2 font-mono text-xs font-black tracking-widest text-gray-300 transition hover:text-white"
            @click="goToGarage"
          >
            <span>01 VEHICLE</span>
            <span class="text-sm font-bold text-[#d4f933]">✓</span>
          </button>

          <span class="text-xs font-bold text-gray-600">/</span>

          <!-- Step 2: Track -->
          <button
            type="button"
            data-testid="wizard-step-2"
            :class="[
              'flex min-h-[48px] items-center gap-1.5 px-2 font-mono text-xs font-black tracking-widest transition',
              currentStep === 2
                ? 'border-b-2 border-[#d4f933] text-[#d4f933]'
                : 'text-gray-300 hover:text-white',
            ]"
            @click="currentStep = 2"
          >
            <span>02 TRACK</span>
            <span v-if="selectedLayoutId" class="text-sm font-bold text-[#d4f933]">✓</span>
          </button>

          <span class="text-xs font-bold text-gray-600">/</span>

          <!-- Step 3: Track Day Initialisation -->
          <button
            type="button"
            data-testid="wizard-step-3"
            :class="[
              'flex min-h-[48px] items-center gap-1.5 px-2 font-mono text-xs font-black tracking-widest transition',
              currentStep === 3
                ? 'border-b-2 border-[#d4f933] text-[#d4f933]'
                : 'text-gray-300 hover:text-white',
            ]"
            @click="currentStep = 3"
          >
            <span>03 TRACK DAY</span>
          </button>
        </div>
      </nav>

      <!-- Step 2: Track & Layout Selector -->
      <section v-if="currentStep === 2" class="space-y-6" aria-label="Track and layout selection">
        <header class="space-y-1">
          <div class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase">
            02 / CHOOSE YOUR TRACK
          </div>
          <h1 class="text-3xl font-black tracking-tight text-white uppercase">
            SELECT TRACK & LAYOUT
          </h1>
          <p class="text-sm font-medium text-gray-400">
            Pick the circuit facility and layout configuration you are taking on today.
          </p>
        </header>

        <TrackSelector
          :selected-track-id="selectedTrackId"
          :selected-layout-id="selectedLayoutId"
          @select="handleTrackSelect"
        />

        <div class="pt-4">
          <PmButton type="button" variant="secondary" class="min-h-[48px]" @click="currentStep = 3">
            Return to track day setup →
          </PmButton>
        </div>
      </section>

      <!-- Step 3: Track Day Initialisation Form -->
      <section v-else class="space-y-6" aria-label="Track day initialisation">
        <!-- Main Header -->
        <header class="space-y-1">
          <div class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase">
            03 / TRACK DAY INITIALISATION
          </div>
          <h1 class="text-3xl font-black tracking-tight text-white uppercase">
            READY FOR THE OUT LAP
          </h1>
          <p class="text-sm font-medium text-gray-400">
            Confirm baseline pressures and paddock conditions before heading out for Session 1.
          </p>
        </header>

        <!-- No Vehicle Warning -->
        <div
          v-if="!activeVehicle"
          class="rounded-2xl border border-dashed border-red-500/50 bg-[#161b22] p-6 text-center"
        >
          <div class="text-base font-bold text-red-400">No active vehicle selected</div>
          <p class="mt-1 text-xs text-gray-400">
            Please select or configure a vehicle in your garage first.
          </p>
          <div class="mt-4 flex justify-center">
            <PmButton type="button" variant="primary" class="!w-auto px-6" @click="goToGarage">
              Select vehicle in garage →
            </PmButton>
          </div>
        </div>

        <template v-else>
          <!-- Selected Vehicle & Layout Pill -->
          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2d3748] bg-[#161b22] p-4"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black tracking-wider text-[#d4f933] uppercase">
                  ACTIVE CAR
                </span>
                <span
                  v-if="activeVehicle.nickname"
                  class="rounded-md border border-[#2d3748] bg-[#1c2330] px-2 py-0.5 font-mono text-[11px] font-bold text-gray-300"
                >
                  {{ activeVehicle.nickname }}
                </span>
              </div>
              <div class="text-lg font-black text-white uppercase">
                {{ activeVehicle.make }} {{ activeVehicle.model }}
              </div>
              <div class="text-xs font-medium text-gray-400">
                {{ selectedTrack?.name ? selectedTrack.name.toUpperCase() : "NO TRACK SELECTED" }}
                <span v-if="selectedLayout?.name"> · {{ selectedLayout.name }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex min-h-[48px] items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] px-4 text-xs font-bold text-gray-300 transition hover:border-[#d4f933] hover:text-white active:scale-98"
                @click="currentStep = 2"
              >
                Change track ↻
              </button>
            </div>
          </div>

          <!-- Date and Ambient Temperature Grid -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <PmInput
                v-model="dateInput"
                name="trackDayDate"
                label="TRACK DAY DATE"
                placeholder="DD / MM / YYYY"
                required
              />
            </div>
            <div>
              <label class="text-xs font-black tracking-wider text-gray-400 uppercase">
                AMBIENT PADDOCK TEMP (°C)
              </label>
              <input
                v-model.number="ambientTemperature"
                type="number"
                name="ambientTemperature"
                placeholder="e.g. 18"
                class="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#2d3748] bg-[#0b0f17] px-4 py-2.5 text-base font-medium text-white transition placeholder:text-gray-600 focus:border-[#d4f933] focus:ring-1 focus:ring-[#d4f933] focus:outline-none"
              />
            </div>
          </div>

          <!-- Cold Start Pressures Section (4 Corners) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-black tracking-widest text-[#d4f933] uppercase">
                COLD START PRESSURES (4 CORNERS)
              </h2>
              <span class="text-xs font-semibold text-gray-400">Unit: {{ pressureUnit }}</span>
            </div>
            <p class="text-xs text-gray-400">
              Set cold starting pressures before heading onto the circuit for Session 1.
            </p>

            <!-- 2x2 Chassis Grid -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Front Left -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-cold-fl"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">FRONT LEFT (FL)</span>
                  <span
                    class="rounded bg-[#1c2330] px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-400"
                  >
                    FRONT AXLE
                  </span>
                </div>
                <PmStepper
                  v-model="coldFl"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>

              <!-- Front Right -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-cold-fr"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">FRONT RIGHT (FR)</span>
                  <span
                    class="rounded bg-[#1c2330] px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-400"
                  >
                    FRONT AXLE
                  </span>
                </div>
                <PmStepper
                  v-model="coldFr"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>

              <!-- Rear Left -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-cold-rl"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">REAR LEFT (RL)</span>
                  <span
                    class="rounded bg-[#1c2330] px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-400"
                  >
                    REAR AXLE
                  </span>
                </div>
                <PmStepper
                  v-model="coldRl"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>

              <!-- Rear Right -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-cold-rr"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">REAR RIGHT (RR)</span>
                  <span
                    class="rounded bg-[#1c2330] px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-400"
                  >
                    REAR AXLE
                  </span>
                </div>
                <PmStepper
                  v-model="coldRr"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>
            </div>
          </div>

          <!-- Hot Target Pressures Section (Axle Based) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-black tracking-widest text-[#d4f933] uppercase">
                HOT TARGET PRESSURES (AXLE-BASED)
              </h2>
              <span class="text-xs font-semibold text-gray-400">Unit: {{ pressureUnit }}</span>
            </div>
            <p class="text-xs text-gray-400">
              Desired operating pressures when coming off track. Bleed calculations will target
              these values.
            </p>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Front Axle Target -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-target-front"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">FRONT AXLE TARGET</span>
                  <span class="text-[10px] font-bold text-[#d4f933]">FL & FR</span>
                </div>
                <PmStepper
                  v-model="targetFront"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>

              <!-- Rear Axle Target -->
              <div
                class="space-y-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-3"
                data-testid="stepper-target-rear"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white">REAR AXLE TARGET</span>
                  <span class="text-[10px] font-bold text-[#d4f933]">RL & RR</span>
                </div>
                <PmStepper
                  v-model="targetRear"
                  :step="0.1"
                  :min="10.0"
                  :max="50.0"
                  :unit="pressureUnit"
                />
              </div>
            </div>
          </div>

          <!-- Auto-bleed Guidance & Prediction Card -->
          <div class="space-y-2 rounded-2xl border border-[#2d3748] bg-[#161b22] p-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black tracking-wider text-[#d4f933] uppercase">
                AUTO-BLEED GUIDANCE & THERMAL GROWTH
              </span>
              <span class="font-mono text-xs font-bold text-gray-400">ESTIMATED RISE</span>
            </div>
            <p class="text-xs text-gray-300">
              Based on your cold starting baseline, expected on-circuit thermal pressure expansion:
            </p>
            <div class="flex flex-wrap items-center gap-4 pt-1 font-mono text-sm">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-gray-400">Front Axle Rise:</span>
                <span class="font-black text-[#d4f933]">{{ frontThermalGrowth }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-gray-400">Rear Axle Rise:</span>
                <span class="font-black text-[#d4f933]">{{ rearThermalGrowth }}</span>
              </div>
            </div>
          </div>

          <!-- Recalled Geometry Preview (Read-Only) -->
          <div class="space-y-3 rounded-2xl border border-[#2d3748] bg-[#161b22]/70 p-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black tracking-wider text-gray-400 uppercase">
                RECALLED GEOMETRY
              </span>
              <span
                class="rounded-md border border-[#2d3748] bg-[#0b0f17] px-2 py-0.5 text-[10px] font-bold text-gray-400"
              >
                READ-ONLY
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="rounded-lg border border-[#2d3748] bg-[#0b0f17] p-2.5">
                <div class="font-bold text-gray-400">FRONT AXLE</div>
                <div class="mt-1 font-mono font-bold text-white">Camber: -2.5° · Toe: 0.00°</div>
              </div>
              <div class="rounded-lg border border-[#2d3748] bg-[#0b0f17] p-2.5">
                <div class="font-bold text-gray-400">REAR AXLE</div>
                <div class="mt-1 font-mono font-bold text-white">
                  Camber: -1.8° · Toe: +0.12° in
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
              <span class="text-[#d4f933]">ⓘ</span>
              <span>Geometry adjustment coming in Phase 2 · Recalled from default baseline</span>
            </div>
          </div>
        </template>
      </section>
    </main>

    <!-- Sticky Bottom Start Button -->
    <footer
      class="fixed right-0 bottom-0 left-0 z-40 border-t border-[#2d3748] bg-[#0b0f17]/95 p-4 backdrop-blur-md"
    >
      <div class="mx-auto max-w-2xl">
        <PmButton
          type="button"
          variant="primary"
          data-testid="btn-start-track-day"
          :disabled="!activeVehicle || !selectedLayoutId || isSubmitting"
          @click="handleStartTrackDay"
        >
          <span v-if="isSubmitting">Initialising Track Day...</span>
          <span v-else>Start track day 🏁</span>
        </PmButton>
      </div>
    </footer>
  </div>
</template>
