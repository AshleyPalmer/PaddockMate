<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHoldRepeat } from "../composables/useHoldRepeat";
import type { PaddockMateDB } from "../db/paddockMateDb";
import { useThemeStore } from "../stores/themeStore";
import { useTrackDayStore } from "../stores/trackDayStore";
import { useTyreReadingStore } from "../stores/tyreReadingStore";
import { calculateTyreBleed } from "../utils/tyre";

type Corner = "FL" | "FR" | "RL" | "RR";

interface CornerConfig {
  code: Corner;
  name: string;
  axle: "Front" | "Rear";
  side: "Left" | "Right";
}

const CORNERS: Record<Corner, CornerConfig> = {
  FL: { code: "FL", name: "Front Left", axle: "Front", side: "Left" },
  FR: { code: "FR", name: "Front Right", axle: "Front", side: "Right" },
  RL: { code: "RL", name: "Rear Left", axle: "Rear", side: "Left" },
  RR: { code: "RR", name: "Rear Right", axle: "Rear", side: "Right" },
};

interface TyreCornerState {
  coldPressure: number;
  hotPressure: number;
  targetPressure: number;
  temperature: number;
  adjustedPressure?: number;
}

const injectedDb = inject<PaddockMateDB | undefined>("db", undefined);
const trackDayStore = useTrackDayStore(injectedDb);
const tyreReadingStore = useTyreReadingStore(injectedDb);
const themeStore = useThemeStore();
const route = useRoute();
const router = useRouter();

const activeCorner = ref<Corner>("FL");
const sessionId = ref<string | null>(null);

const tyres = ref<Record<Corner, TyreCornerState>>({
  FL: { coldPressure: 28.0, hotPressure: 32.0, targetPressure: 30.0, temperature: 60 },
  FR: { coldPressure: 28.0, hotPressure: 32.0, targetPressure: 30.0, temperature: 60 },
  RL: { coldPressure: 27.0, hotPressure: 30.0, targetPressure: 28.0, temperature: 55 },
  RR: { coldPressure: 27.0, hotPressure: 30.0, targetPressure: 28.0, temperature: 55 },
});

const currentTyre = computed(() => tyres.value[activeCorner.value]);
const currentCorner = computed(() => CORNERS[activeCorner.value]);
const isDark = computed(() => themeStore.isDark);

type BleedState = "bleed" | "inflate" | "target";

function getBleedState(hot: number, target: number): BleedState {
  const diff = Number((hot - target).toFixed(2));
  if (diff > 0) return "bleed";
  if (diff < 0) return "inflate";
  return "target";
}

function getBleedInfo(hot: number, target: number) {
  const { bleed } = calculateTyreBleed(hot, target);
  const diff = Math.abs(bleed).toFixed(1);
  const state = getBleedState(hot, target);

  switch (state) {
    case "bleed":
      return {
        state,
        icon: "▼",
        short: `BLEED ${diff}`,
        long: `BLEED ${diff} PSI`,
        badgeText: `▼ BLEED -${diff} PSI`,
        colour: "text-amber-400 [data-theme=sunlight]:text-black",
        badgeClasses: isDark.value
          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
          : "bg-yellow-300 text-black border-black",
      };
    case "inflate":
      return {
        state,
        icon: "▲",
        short: `INFLATE ${diff}`,
        long: `INFLATE ${diff} PSI`,
        badgeText: `▲ INFLATE +${diff} PSI`,
        colour: "text-cyan-400 [data-theme=sunlight]:text-blue-900",
        badgeClasses: isDark.value
          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
          : "bg-blue-800 text-white border-black",
      };
    default:
      return {
        state,
        icon: "✓",
        short: "ON TARGET",
        long: "ON TARGET",
        badgeText: "✓ ON TARGET",
        colour: "text-emerald-400 [data-theme=sunlight]:text-green-900",
        badgeClasses: isDark.value
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          : "bg-green-800 text-white border-black",
      };
  }
}

// Summary across all four corners for quick pit-lane assessment
const summary = computed(() => {
  const corners: Corner[] = ["FL", "FR", "RL", "RR"];
  const states = corners.map((c) =>
    getBleedState(tyres.value[c].hotPressure, tyres.value[c].targetPressure)
  );
  return {
    bleed: states.filter((s) => s === "bleed").length,
    inflate: states.filter((s) => s === "inflate").length,
    done: states.filter((s) => s === "target").length,
  };
});

function haptic(pattern: number | number[] = 8) {
  if (
    typeof globalThis !== "undefined" &&
    "navigator" in globalThis &&
    typeof (globalThis.navigator as Navigator | undefined)?.vibrate === "function"
  ) {
    try {
      (globalThis.navigator as Navigator).vibrate(pattern);
    } catch {
      // Haptics not supported in environment
    }
  }
}

async function persistCorner(corner: Corner) {
  if (!sessionId.value) return;
  const item = tyres.value[corner];
  await tyreReadingStore.saveReading({
    sessionId: sessionId.value,
    corner,
    coldPressure: item.coldPressure,
    hotPressure: item.hotPressure,
    targetPressure: item.targetPressure,
    temperature: item.temperature,
    adjustedPressure: item.adjustedPressure,
  });
}

function adjustHot(delta: number) {
  const tyre = tyres.value[activeCorner.value];
  tyre.hotPressure = Number(Math.min(50.0, Math.max(10.0, tyre.hotPressure + delta)).toFixed(1));
  haptic(8);
  persistCorner(activeCorner.value);
}

function setToTarget() {
  const tyre = tyres.value[activeCorner.value];
  tyre.hotPressure = tyre.targetPressure;
  tyre.adjustedPressure = tyre.targetPressure;
  haptic([20, 40, 20]);
  persistCorner(activeCorner.value);
}

function adjustTarget(delta: number) {
  const tyre = tyres.value[activeCorner.value];
  tyre.targetPressure = Number(
    Math.min(50.0, Math.max(10.0, tyre.targetPressure + delta)).toFixed(1)
  );
  haptic(8);
  persistCorner(activeCorner.value);
}

function adjustTemp(delta: number) {
  const tyre = tyres.value[activeCorner.value];
  tyre.temperature = Math.max(0, tyre.temperature + delta);
  haptic(8);
  persistCorner(activeCorner.value);
}

// Hold-to-repeat steppers
const hotFineDec = useHoldRepeat(() => adjustHot(-0.1));
const hotFineInc = useHoldRepeat(() => adjustHot(0.1));
const targetDec = useHoldRepeat(() => adjustTarget(-0.1));
const targetInc = useHoldRepeat(() => adjustTarget(0.1));
const tempDec = useHoldRepeat(() => adjustTemp(-1));
const tempInc = useHoldRepeat(() => adjustTemp(1));

// Screen wake lock for hands-on pit-lane sessions
const wakeLockSupported =
  typeof globalThis !== "undefined" &&
  "navigator" in globalThis &&
  "wakeLock" in (globalThis.navigator as Navigator);
const wakeLock = ref<WakeLockSentinel | null>(null);

async function toggleWakeLock() {
  if (wakeLock.value) {
    await wakeLock.value.release();
    wakeLock.value = null;
    return;
  }
  if (wakeLockSupported && typeof globalThis !== "undefined" && "navigator" in globalThis) {
    try {
      const nav = globalThis.navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
      };
      if (nav.wakeLock) {
        wakeLock.value = await nav.wakeLock.request("screen");
        wakeLock.value.addEventListener("release", () => {
          wakeLock.value = null;
        });
      }
    } catch {
      wakeLock.value = null;
    }
  }
}

onBeforeUnmount(() => {
  wakeLock.value?.release();
});

async function loadSessionData() {
  const trackDayId = route.params.id as string | undefined;
  const sessionNum = Number(route.params.sessionNumber) || 1;

  if (trackDayId) {
    await trackDayStore.loadTrackDay(trackDayId);
    const session = trackDayStore.sessions.find((s) => s.sessionNumber === sessionNum);

    if (session) {
      sessionId.value = session.id;
      trackDayStore.setActiveSession(session.id);
      await tyreReadingStore.fetchReadingsForSession(session.id);

      const corners: Corner[] = ["FL", "FR", "RL", "RR"];
      for (const corner of corners) {
        const dbReading = tyreReadingStore.readings[corner];
        if (dbReading) {
          tyres.value[corner] = {
            coldPressure: dbReading.coldPressure ?? (corner.startsWith("F") ? 28.0 : 27.0),
            hotPressure:
              dbReading.hotPressure ??
              dbReading.targetPressure ??
              (corner.startsWith("F") ? 32.0 : 30.0),
            targetPressure: dbReading.targetPressure ?? (corner.startsWith("F") ? 30.0 : 28.0),
            temperature: dbReading.temperature ?? 60,
            adjustedPressure: dbReading.adjustedPressure,
          };
        }
      }
    }
  }
}

watch(
  () => [route.params.id, route.params.sessionNumber],
  () => {
    loadSessionData();
  }
);

onMounted(() => {
  loadSessionData();
});
</script>

<template>
  <div
    data-testid="session-tyre-view"
    class="min-h-screen bg-[#0b0f17] text-white [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
  >
    <main class="mx-auto flex w-full max-w-xl flex-col px-4 py-4 pb-28">
      <!-- Session Header & Paddock Context -->
      <header
        class="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d3748] pb-3 [data-theme=sunlight]:border-black"
      >
        <div>
          <span
            class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase [data-theme=sunlight]:text-black"
          >
            PIT-LANE TYRE LOGGER
          </span>
          <h1 class="text-xl font-black tracking-tight uppercase">
            {{ trackDayStore.activeTrackDay ? "TRACK DAY SESSION" : "PIT-LANE SESSION" }}
            {{ route.params.sessionNumber ? `· #${route.params.sessionNumber}` : "" }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Wake Lock Toggle Button (if supported) -->
          <button
            v-if="wakeLockSupported"
            type="button"
            data-testid="btn-wake-lock"
            class="flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#2d3748] bg-[#161b22] px-3 font-mono text-xs font-bold text-gray-300 transition hover:border-[#d4f933] active:scale-95 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-gray-100 [data-theme=sunlight]:text-black"
            @click="toggleWakeLock"
          >
            <span>{{ wakeLock ? "☀ AWAKE" : "🌙 AUTO" }}</span>
          </button>

          <button
            type="button"
            data-testid="btn-nav-garage"
            class="flex min-h-[48px] items-center rounded-xl border border-[#2d3748] bg-[#161b22] px-3 font-mono text-xs font-bold text-gray-300 transition hover:text-white [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-gray-100 [data-theme=sunlight]:text-black"
            @click="router.push('/vehicles')"
          >
            GARAGE →
          </button>
        </div>
      </header>

      <!-- Overall Status Summary Bar -->
      <div
        data-testid="tyre-status-summary"
        class="my-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2d3748] bg-[#161b22] p-2.5 font-mono text-xs font-black uppercase [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-gray-100"
      >
        <span class="text-amber-400 [data-theme=sunlight]:text-black">
          ▼ {{ summary.bleed }} TO BLEED
        </span>
        <span class="text-cyan-400 [data-theme=sunlight]:text-blue-900">
          ▲ {{ summary.inflate }} TO INFLATE
        </span>
        <span class="text-emerald-400 [data-theme=sunlight]:text-green-900">
          ✓ {{ summary.done }} DONE
        </span>
      </div>

      <!-- Top-Down Chassis Diagram with 4-Corner Touch Cards -->
      <section
        aria-label="Chassis tyre pressure map"
        class="relative my-2 rounded-2xl border border-[#2d3748] bg-[#161b22]/70 p-4 shadow-xl sm:p-6 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white"
      >
        <!-- Car Body Outline Silhouette -->
        <div
          data-testid="chassis-silhouette"
          class="relative mx-auto flex h-64 w-32 flex-col items-center justify-between rounded-[2.5rem] border-2 border-dashed border-[#2d3748] py-4 opacity-40 [data-theme=sunlight]:border-black"
          aria-hidden="true"
        >
          <div
            class="h-8 w-16 rounded-b-xl border-b-2 border-[#2d3748] [data-theme=sunlight]:border-black"
          ></div>
          <div
            class="font-mono text-[10px] font-black tracking-widest text-[#d4f933] uppercase [data-theme=sunlight]:text-black"
          >
            FRONT ▲
          </div>
          <div
            class="h-6 w-20 rounded-t-lg border-t-2 border-[#2d3748] [data-theme=sunlight]:border-black"
          ></div>
        </div>

        <!-- 4 Corner Touch Cards positioned around the chassis -->
        <div class="pointer-events-none absolute inset-0 grid grid-cols-2 p-3 sm:p-4">
          <!-- FL: Front Left -->
          <div class="flex items-start justify-start">
            <button
              type="button"
              :data-testid="'corner-card-FL'"
              :class="[
                'pointer-events-auto min-h-[48px] w-36 rounded-xl border-2 p-2.5 text-left transition select-none sm:w-40',
                activeCorner === 'FL'
                  ? isDark
                    ? 'border-[#d4f933] bg-[#1c2330] shadow-lg ring-2 shadow-[#d4f933]/10 ring-[#d4f933]/50'
                    : 'border-black bg-black text-white shadow-lg'
                  : isDark
                    ? 'border-[#2d3748] bg-[#0b0f17] hover:border-gray-500'
                    : 'border-2 border-black bg-white text-black hover:bg-gray-50',
              ]"
              @click="activeCorner = 'FL'"
            >
              <div class="flex items-center justify-between font-mono text-xs font-black">
                <span>FL</span>
                <span class="text-[11px] opacity-80">{{ tyres.FL.temperature }}°C</span>
              </div>
              <div class="mt-0.5 font-mono text-2xl font-black tracking-tight">
                {{ tyres.FL.hotPressure.toFixed(1) }}
                <span class="text-[10px] font-normal opacity-70">PSI</span>
              </div>
              <div
                :class="[
                  'mt-1 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-black tracking-wide uppercase',
                  getBleedInfo(tyres.FL.hotPressure, tyres.FL.targetPressure).badgeClasses,
                ]"
              >
                {{ getBleedInfo(tyres.FL.hotPressure, tyres.FL.targetPressure).icon }}
                {{ getBleedInfo(tyres.FL.hotPressure, tyres.FL.targetPressure).short }}
              </div>
            </button>
          </div>

          <!-- FR: Front Right -->
          <div class="flex items-start justify-end">
            <button
              type="button"
              :data-testid="'corner-card-FR'"
              :class="[
                'pointer-events-auto min-h-[48px] w-36 rounded-xl border-2 p-2.5 text-right transition select-none sm:w-40',
                activeCorner === 'FR'
                  ? isDark
                    ? 'border-[#d4f933] bg-[#1c2330] shadow-lg ring-2 shadow-[#d4f933]/10 ring-[#d4f933]/50'
                    : 'border-black bg-black text-white shadow-lg'
                  : isDark
                    ? 'border-[#2d3748] bg-[#0b0f17] hover:border-gray-500'
                    : 'border-2 border-black bg-white text-black hover:bg-gray-50',
              ]"
              @click="activeCorner = 'FR'"
            >
              <div class="flex items-center justify-between font-mono text-xs font-black">
                <span class="text-[11px] opacity-80">{{ tyres.FR.temperature }}°C</span>
                <span>FR</span>
              </div>
              <div class="mt-0.5 font-mono text-2xl font-black tracking-tight">
                {{ tyres.FR.hotPressure.toFixed(1) }}
                <span class="text-[10px] font-normal opacity-70">PSI</span>
              </div>
              <div
                :class="[
                  'mt-1 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-black tracking-wide uppercase',
                  getBleedInfo(tyres.FR.hotPressure, tyres.FR.targetPressure).badgeClasses,
                ]"
              >
                {{ getBleedInfo(tyres.FR.hotPressure, tyres.FR.targetPressure).icon }}
                {{ getBleedInfo(tyres.FR.hotPressure, tyres.FR.targetPressure).short }}
              </div>
            </button>
          </div>

          <!-- RL: Rear Left -->
          <div class="flex items-end justify-start">
            <button
              type="button"
              :data-testid="'corner-card-RL'"
              :class="[
                'pointer-events-auto min-h-[48px] w-36 rounded-xl border-2 p-2.5 text-left transition select-none sm:w-40',
                activeCorner === 'RL'
                  ? isDark
                    ? 'border-[#d4f933] bg-[#1c2330] shadow-lg ring-2 shadow-[#d4f933]/10 ring-[#d4f933]/50'
                    : 'border-black bg-black text-white shadow-lg'
                  : isDark
                    ? 'border-[#2d3748] bg-[#0b0f17] hover:border-gray-500'
                    : 'border-2 border-black bg-white text-black hover:bg-gray-50',
              ]"
              @click="activeCorner = 'RL'"
            >
              <div class="flex items-center justify-between font-mono text-xs font-black">
                <span>RL</span>
                <span class="text-[11px] opacity-80">{{ tyres.RL.temperature }}°C</span>
              </div>
              <div class="mt-0.5 font-mono text-2xl font-black tracking-tight">
                {{ tyres.RL.hotPressure.toFixed(1) }}
                <span class="text-[10px] font-normal opacity-70">PSI</span>
              </div>
              <div
                :class="[
                  'mt-1 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-black tracking-wide uppercase',
                  getBleedInfo(tyres.RL.hotPressure, tyres.RL.targetPressure).badgeClasses,
                ]"
              >
                {{ getBleedInfo(tyres.RL.hotPressure, tyres.RL.targetPressure).icon }}
                {{ getBleedInfo(tyres.RL.hotPressure, tyres.RL.targetPressure).short }}
              </div>
            </button>
          </div>

          <!-- RR: Rear Right -->
          <div class="flex items-end justify-end">
            <button
              type="button"
              :data-testid="'corner-card-RR'"
              :class="[
                'pointer-events-auto min-h-[48px] w-36 rounded-xl border-2 p-2.5 text-right transition select-none sm:w-40',
                activeCorner === 'RR'
                  ? isDark
                    ? 'border-[#d4f933] bg-[#1c2330] shadow-lg ring-2 shadow-[#d4f933]/10 ring-[#d4f933]/50'
                    : 'border-black bg-black text-white shadow-lg'
                  : isDark
                    ? 'border-[#2d3748] bg-[#0b0f17] hover:border-gray-500'
                    : 'border-2 border-black bg-white text-black hover:bg-gray-50',
              ]"
              @click="activeCorner = 'RR'"
            >
              <div class="flex items-center justify-between font-mono text-xs font-black">
                <span class="text-[11px] opacity-80">{{ tyres.RR.temperature }}°C</span>
                <span>RR</span>
              </div>
              <div class="mt-0.5 font-mono text-2xl font-black tracking-tight">
                {{ tyres.RR.hotPressure.toFixed(1) }}
                <span class="text-[10px] font-normal opacity-70">PSI</span>
              </div>
              <div
                :class="[
                  'mt-1 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-black tracking-wide uppercase',
                  getBleedInfo(tyres.RR.hotPressure, tyres.RR.targetPressure).badgeClasses,
                ]"
              >
                {{ getBleedInfo(tyres.RR.hotPressure, tyres.RR.targetPressure).icon }}
                {{ getBleedInfo(tyres.RR.hotPressure, tyres.RR.targetPressure).short }}
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- Active Corner Control Panel -->
      <section
        aria-label="Active corner tyre controls"
        class="mt-2 space-y-4 rounded-2xl border border-[#2d3748] bg-[#161b22] p-4 shadow-xl [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white"
      >
        <!-- Corner Title Header -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <span
              class="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase [data-theme=sunlight]:text-gray-600"
            >
              SELECTED CORNER
            </span>
            <h2 data-testid="active-corner-title" class="text-2xl font-black tracking-tight">
              {{ currentCorner.name }}
            </h2>
          </div>
          <span
            class="rounded-lg border border-[#2d3748] bg-[#0b0f17] px-3 py-1 font-mono text-base font-black text-[#d4f933] [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-black [data-theme=sunlight]:text-white"
          >
            {{ currentCorner.code }}
          </span>
        </div>

        <!-- Prominent Bleed Status Bar -->
        <div
          data-testid="active-bleed-status"
          :class="[
            'flex min-h-[48px] items-center justify-center rounded-xl border-2 py-2 text-center font-mono text-lg font-black tracking-wider uppercase',
            getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).badgeClasses,
          ]"
        >
          {{ getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).badgeText }}
        </div>

        <!-- Hot Pressure Big Readout -->
        <div class="text-center">
          <div
            class="font-mono text-xs font-black tracking-widest text-gray-400 uppercase [data-theme=sunlight]:text-gray-600"
          >
            HOT PRESSURE READING
          </div>
          <div
            data-testid="hot-pressure-readout"
            class="mt-1 font-mono text-6xl font-black tracking-tight select-none sm:text-7xl"
          >
            {{ currentTyre.hotPressure.toFixed(1) }}
            <span class="text-2xl font-bold opacity-60">PSI</span>
          </div>
        </div>

        <!-- Stepper Controls for Hot Pressure -->
        <div class="space-y-2">
          <!-- Fine Steppers: -0.1 and +0.1 with Hold-to-Repeat -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="btn-hot-fine-dec"
              aria-label="Decrease hot pressure by 0.1 PSI"
              class="flex h-14 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-2xl font-black text-white transition select-none active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              v-on="hotFineDec.handlers"
            >
              −0.1
            </button>
            <button
              type="button"
              data-testid="btn-hot-fine-inc"
              aria-label="Increase hot pressure by 0.1 PSI"
              class="flex h-14 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-2xl font-black text-white transition select-none active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              v-on="hotFineInc.handlers"
            >
              +0.1
            </button>
          </div>

          <!-- Coarse Steppers: -1.0, -0.5, +0.5, +1.0 -->
          <div class="grid grid-cols-4 gap-2">
            <button
              type="button"
              data-testid="btn-hot-minus-1"
              aria-label="Decrease hot pressure by 1.0 PSI"
              class="flex h-12 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#0b0f17] font-mono text-base font-black text-gray-200 transition select-none hover:border-gray-500 active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              @click="adjustHot(-1.0)"
            >
              −1.0
            </button>
            <button
              type="button"
              data-testid="btn-hot-minus-05"
              aria-label="Decrease hot pressure by 0.5 PSI"
              class="flex h-12 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#0b0f17] font-mono text-base font-black text-gray-200 transition select-none hover:border-gray-500 active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              @click="adjustHot(-0.5)"
            >
              −0.5
            </button>
            <button
              type="button"
              data-testid="btn-hot-plus-05"
              aria-label="Increase hot pressure by 0.5 PSI"
              class="flex h-12 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#0b0f17] font-mono text-base font-black text-gray-200 transition select-none hover:border-gray-500 active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              @click="adjustHot(0.5)"
            >
              +0.5
            </button>
            <button
              type="button"
              data-testid="btn-hot-plus-1"
              aria-label="Increase hot pressure by 1.0 PSI"
              class="flex h-12 min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#0b0f17] font-mono text-base font-black text-gray-200 transition select-none hover:border-gray-500 active:scale-95 active:bg-[#d4f933] active:text-black [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
              @click="adjustHot(1.0)"
            >
              +1.0
            </button>
          </div>

          <!-- 1-Tap "Match Target" Helper Button -->
          <button
            type="button"
            data-testid="btn-set-to-target"
            class="flex h-14 min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] px-4 font-mono text-sm font-black tracking-wider uppercase transition select-none hover:border-[#d4f933] active:scale-98 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-black [data-theme=sunlight]:text-white"
            @click="setToTarget"
          >
            Bled to target? Tap to set {{ currentTyre.targetPressure.toFixed(1) }} PSI
          </button>
        </div>

        <!-- Target Pressure & Temperature Sub-Panel -->
        <div
          class="grid grid-cols-2 gap-3 border-t border-[#2d3748] pt-3 [data-theme=sunlight]:border-black"
        >
          <!-- Target Pressure Stepper -->
          <div
            class="flex flex-col justify-between rounded-xl border border-[#2d3748] bg-[#0b0f17] p-3 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white"
          >
            <div class="flex items-center justify-between">
              <span
                class="font-mono text-[11px] font-black tracking-wide text-gray-400 uppercase [data-theme=sunlight]:text-gray-600"
              >
                Target Hot
              </span>
              <span class="font-mono text-[10px] text-gray-500">0.1 step</span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span
                data-testid="target-pressure-readout"
                class="font-mono text-xl font-black text-white [data-theme=sunlight]:text-black"
              >
                {{ currentTyre.targetPressure.toFixed(1) }} PSI
              </span>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  data-testid="btn-target-dec"
                  aria-label="Decrease target hot pressure"
                  class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-xl font-black text-white transition select-none active:scale-90 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
                  v-on="targetDec.handlers"
                >
                  −
                </button>
                <button
                  type="button"
                  data-testid="btn-target-inc"
                  aria-label="Increase target hot pressure"
                  class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-xl font-black text-white transition select-none active:scale-90 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
                  v-on="targetInc.handlers"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Tyre Temperature Stepper -->
          <div
            class="flex flex-col justify-between rounded-xl border border-[#2d3748] bg-[#0b0f17] p-3 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white"
          >
            <div class="flex items-center justify-between">
              <span
                class="font-mono text-[11px] font-black tracking-wide text-gray-400 uppercase [data-theme=sunlight]:text-gray-600"
              >
                Tyre Temp
              </span>
              <span class="font-mono text-[10px] text-gray-500">1°C step</span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span
                data-testid="temp-readout"
                class="font-mono text-xl font-black text-white [data-theme=sunlight]:text-black"
              >
                {{ currentTyre.temperature }}°C
              </span>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  data-testid="btn-temp-dec"
                  aria-label="Decrease tyre temperature"
                  class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-xl font-black text-white transition select-none active:scale-90 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
                  v-on="tempDec.handlers"
                >
                  −
                </button>
                <button
                  type="button"
                  data-testid="btn-temp-inc"
                  aria-label="Increase tyre temperature"
                  class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-xl font-black text-white transition select-none active:scale-90 [data-theme=sunlight]:border-2 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
                  v-on="tempInc.handlers"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
