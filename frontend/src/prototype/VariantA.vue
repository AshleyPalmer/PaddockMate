<script setup lang="ts">
import { ref, computed } from 'vue'
import { CORNERS, calculateBleed, type Corner, type TyresState } from './types'
import { useHoldRepeat } from '../composables/useHoldRepeat'

const props = defineProps<{
  tyres: TyresState
}>()

const activeCorner = ref<Corner>('FL')

const currentTyre = computed(() => props.tyres[activeCorner.value])
const currentCorner = computed(() => CORNERS[activeCorner.value])

function getBleedInfo(hot: number, target: number) {
  const diff = calculateBleed(hot, target)
  if (diff > 0) {
    return {
      text: `Bleed -${diff.toFixed(1)}`,
      badgeText: `▼ BLEED -${diff.toFixed(1)} PSI`,
      colour: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    }
  } else if (diff < 0) {
    const absDiff = Math.abs(diff).toFixed(1)
    return {
      text: `Add +${absDiff}`,
      badgeText: `▲ INFLATE +${absDiff} PSI`,
      colour: 'text-cyan-400',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    }
  } else {
    return {
      text: 'On Target',
      badgeText: '✓ ON TARGET',
      colour: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    }
  }
}

function adjustHot(delta: number) {
  currentTyre.value.hotPressure = Number(
    Math.max(10, currentTyre.value.hotPressure + delta).toFixed(1)
  )
}

function setToTarget() {
  currentTyre.value.hotPressure = currentTyre.value.targetPressure
}

function adjustTarget(delta: number) {
  currentTyre.value.targetPressure = Number(
    Math.max(10, currentTyre.value.targetPressure + delta).toFixed(1)
  )
}

function adjustTemp(delta: number) {
  currentTyre.value.temperature = Math.max(0, currentTyre.value.temperature + delta)
}

// Hold-to-repeat steppers
const hotFineDec = useHoldRepeat(() => adjustHot(-0.1))
const hotFineInc = useHoldRepeat(() => adjustHot(0.1))
const targetDec = useHoldRepeat(() => adjustTarget(-0.1))
const targetInc = useHoldRepeat(() => adjustTarget(0.1))
const tempDec = useHoldRepeat(() => adjustTemp(-1))
const tempInc = useHoldRepeat(() => adjustTemp(1))
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 pb-28 max-w-md mx-auto">
    <!-- Header -->
    <header class="flex items-center justify-between py-3 border-b border-slate-800">
      <div>
        <span class="text-xs font-semibold uppercase tracking-wider text-amber-400">Pit-Lane Tyre Pressures</span>
        <h1 class="text-xl font-bold tracking-tight text-white">Chassis Silhouette</h1>
      </div>
      <div class="text-right">
        <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300">
          Brands Hatch Indy
        </span>
      </div>
    </header>

    <!-- Top-Down Chassis Diagram with Corner Selectors -->
    <div class="relative my-5 px-4 py-8 bg-slate-900/60 rounded-2xl border border-slate-800/80">
      <!-- Car Body Outline Silhouette -->
      <div class="w-32 h-64 mx-auto border-2 border-dashed border-slate-700/80 rounded-[2.5rem] relative flex flex-col justify-between items-center py-4 opacity-40">
        <div class="w-16 h-8 border-b-2 border-slate-600 rounded-b-xl"></div>
        <div class="text-[10px] font-mono tracking-widest text-slate-400 uppercase">FRONT ▲</div>
        <div class="w-20 h-6 border-t-2 border-slate-600 rounded-t-lg"></div>
      </div>

      <!-- 4 Corner Touch Cards positioned around the car -->
      <!-- Front Left -->
      <button
        type="button"
        @click="activeCorner = 'FL'"
        :class="[
          'absolute top-6 left-4 w-32 p-3 rounded-xl border text-left transition-all',
          activeCorner === 'FL'
            ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900 border-slate-700/70 hover:border-slate-600'
        ]"
      >
        <div class="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>FL</span>
          <span>{{ tyres.FL.temperature }}°C</span>
        </div>
        <div class="mt-1 text-2xl font-black font-mono tracking-tight text-white">
          {{ tyres.FL.hotPressure }} <span class="text-xs font-normal text-slate-400">PSI</span>
        </div>
        <div :class="['text-[11px] font-semibold mt-1 font-mono', getBleedInfo(tyres.FL.hotPressure, tyres.FL.targetPressure).colour]">
          {{ getBleedInfo(tyres.FL.hotPressure, tyres.FL.targetPressure).text }}
        </div>
      </button>

      <!-- Front Right -->
      <button
        type="button"
        @click="activeCorner = 'FR'"
        :class="[
          'absolute top-6 right-4 w-32 p-3 rounded-xl border text-right transition-all',
          activeCorner === 'FR'
            ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900 border-slate-700/70 hover:border-slate-600'
        ]"
      >
        <div class="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>{{ tyres.FR.temperature }}°C</span>
          <span>FR</span>
        </div>
        <div class="mt-1 text-2xl font-black font-mono tracking-tight text-white">
          {{ tyres.FR.hotPressure }} <span class="text-xs font-normal text-slate-400">PSI</span>
        </div>
        <div :class="['text-[11px] font-semibold mt-1 font-mono', getBleedInfo(tyres.FR.hotPressure, tyres.FR.targetPressure).colour]">
          {{ getBleedInfo(tyres.FR.hotPressure, tyres.FR.targetPressure).text }}
        </div>
      </button>

      <!-- Rear Left -->
      <button
        type="button"
        @click="activeCorner = 'RL'"
        :class="[
          'absolute bottom-6 left-4 w-32 p-3 rounded-xl border text-left transition-all',
          activeCorner === 'RL'
            ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900 border-slate-700/70 hover:border-slate-600'
        ]"
      >
        <div class="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>RL</span>
          <span>{{ tyres.RL.temperature }}°C</span>
        </div>
        <div class="mt-1 text-2xl font-black font-mono tracking-tight text-white">
          {{ tyres.RL.hotPressure }} <span class="text-xs font-normal text-slate-400">PSI</span>
        </div>
        <div :class="['text-[11px] font-semibold mt-1 font-mono', getBleedInfo(tyres.RL.hotPressure, tyres.RL.targetPressure).colour]">
          {{ getBleedInfo(tyres.RL.hotPressure, tyres.RL.targetPressure).text }}
        </div>
      </button>

      <!-- Rear Right -->
      <button
        type="button"
        @click="activeCorner = 'RR'"
        :class="[
          'absolute bottom-6 right-4 w-32 p-3 rounded-xl border text-right transition-all',
          activeCorner === 'RR'
            ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900 border-slate-700/70 hover:border-slate-600'
        ]"
      >
        <div class="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>{{ tyres.RR.temperature }}°C</span>
          <span>RR</span>
        </div>
        <div class="mt-1 text-2xl font-black font-mono tracking-tight text-white">
          {{ tyres.RR.hotPressure }} <span class="text-xs font-normal text-slate-400">PSI</span>
        </div>
        <div :class="['text-[11px] font-semibold mt-1 font-mono', getBleedInfo(tyres.RR.hotPressure, tyres.RR.targetPressure).colour]">
          {{ getBleedInfo(tyres.RR.hotPressure, tyres.RR.targetPressure).text }}
        </div>
      </button>
    </div>

    <!-- Active Corner Glove Stepper Panel -->
    <div class="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span class="text-xs uppercase font-bold tracking-wider text-slate-400">Active Corner</span>
          <h2 class="text-lg font-bold text-white">{{ currentCorner.name }} ({{ currentCorner.code }})</h2>
        </div>

        <!-- Calculated Bleed Badge with Fixed Tri-State Logic -->
        <div
          :class="[
            'px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-1.5 border',
            getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).badgeClass
          ]"
        >
          <span>{{ getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).badgeText }}</span>
        </div>
      </div>

      <!-- Large Hot Pressure Readout -->
      <div class="my-4 text-center">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hot Pressure Off Track</span>
        <div class="text-5xl font-black font-mono tracking-tight text-white my-1">
          {{ currentTyre.hotPressure.toFixed(1) }} <span class="text-xl font-normal text-slate-400">PSI</span>
        </div>

        <!-- Stepper Controls with Granular 0.1 Accuracy -->
        <div class="space-y-2.5 mt-4">
          <!-- Row 1: Fine-Tuning 0.1 PSI Steppers with Hold-to-Repeat -->
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              v-on="hotFineDec.handlers"
              aria-label="Decrease hot pressure by 0.1 PSI"
              class="h-14 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border-2 border-amber-500/40 text-amber-300 font-mono font-black text-lg transition flex items-center justify-center gap-2 select-none touch-none"
            >
              <span class="text-sm font-sans font-normal text-slate-400">Fine:</span> -0.1 PSI
            </button>
            <button
              type="button"
              v-on="hotFineInc.handlers"
              aria-label="Increase hot pressure by 0.1 PSI"
              class="h-14 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border-2 border-amber-500/40 text-amber-300 font-mono font-black text-lg transition flex items-center justify-center gap-2 select-none touch-none"
            >
              <span class="text-sm font-sans font-normal text-slate-400">Fine:</span> +0.1 PSI
            </button>
          </div>

          <!-- Row 2: Coarse Adjustments (-1.0, -0.5, +0.5, +1.0) -->
          <div class="grid grid-cols-4 gap-2">
            <button
              type="button"
              @click="adjustHot(-1.0)"
              class="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center select-none"
            >
              -1.0
            </button>
            <button
              type="button"
              @click="adjustHot(-0.5)"
              class="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center select-none"
            >
              -0.5
            </button>
            <button
              type="button"
              @click="adjustHot(0.5)"
              class="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center select-none"
            >
              +0.5
            </button>
            <button
              type="button"
              @click="adjustHot(1.0)"
              class="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center select-none"
            >
              +1.0
            </button>
          </div>

          <!-- 1-Tap "Match Target" Helper Button -->
          <button
            type="button"
            @click="setToTarget"
            class="w-full py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 transition select-none"
          >
            Bled to target? Tap to set exactly to {{ currentTyre.targetPressure.toFixed(1) }} PSI
          </button>
        </div>
      </div>

      <!-- Target & Temperature Sub-Controls with Hold-to-Repeat -->
      <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
        <!-- Target Pressure -->
        <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Target Hot</span>
            <span class="text-[10px] text-slate-500 font-mono">0.1 step</span>
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xl font-bold font-mono text-white">{{ currentTyre.targetPressure.toFixed(1) }} PSI</span>
            <div class="flex gap-1.5">
              <button
                type="button"
                v-on="targetDec.handlers"
                aria-label="Decrease target hot pressure"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-100 select-none touch-none transition"
              >
                -
              </button>
              <button
                type="button"
                v-on="targetInc.handlers"
                aria-label="Increase target hot pressure"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-100 select-none touch-none transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Tyre Temperature -->
        <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tyre Temp</span>
            <span class="text-[10px] text-slate-500 font-mono">1°C step</span>
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xl font-bold font-mono text-white">{{ currentTyre.temperature }}°C</span>
            <div class="flex gap-1.5">
              <button
                type="button"
                v-on="tempDec.handlers"
                aria-label="Decrease tyre temperature"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-100 select-none touch-none transition"
              >
                -
              </button>
              <button
                type="button"
                v-on="tempInc.handlers"
                aria-label="Increase tyre temperature"
                class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-100 select-none touch-none transition"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
