<!--
  UI PROTOTYPE: Sunlight / High-Contrast Variant
  Same interaction model as Variant A (chassis map + bottom stepper panel), tuned for
  bright outdoor paddock conditions:
  - Pure black text and borders on pure white (21:1); neutral only, no tinted greys,
    so nothing picks up a blue (slate) or cream (stone) cast;
    no translucent or thin grey text
  - Status never relies on colour alone: every state has an icon, a word and a solid fill
  - Selected corner is fully inverted (black card, white text) so it reads at a glance
  - Thick 3px borders and larger type so edges survive screen glare
  - Haptic tick on every step (Android) and an optional screen wake lock
-->
<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { CORNERS, calculateBleed, type Corner, type TyresState } from './types'
import { useHoldRepeat } from '../composables/useHoldRepeat'

const props = defineProps<{
  tyres: TyresState
}>()

const activeCorner = ref<Corner>('FL')
const currentTyre = computed(() => props.tyres[activeCorner.value])
const currentCorner = computed(() => CORNERS[activeCorner.value])

type BleedState = 'bleed' | 'inflate' | 'target'

function getBleedState(hot: number, target: number): BleedState {
  const diff = calculateBleed(hot, target)
  if (diff > 0) return 'bleed'
  if (diff < 0) return 'inflate'
  return 'target'
}

function getBleedInfo(hot: number, target: number) {
  const diff = Math.abs(calculateBleed(hot, target)).toFixed(1)
  const state = getBleedState(hot, target)
  switch (state) {
    case 'bleed':
      return {
        icon: '▼',
        short: `BLEED ${diff}`,
        long: `BLEED ${diff} PSI`,
        classes: 'bg-yellow-300 text-black border-black',
      }
    case 'inflate':
      return {
        icon: '▲',
        short: `ADD ${diff}`,
        long: `ADD ${diff} PSI`,
        classes: 'bg-blue-800 text-white border-black',
      }
    default:
      return {
        icon: '✓',
        short: 'ON TARGET',
        long: 'ON TARGET',
        classes: 'bg-green-800 text-white border-black',
      }
  }
}

// Summary across all four corners so the driver knows how much work is left
const summary = computed(() => {
  const codes = Object.keys(props.tyres) as Corner[]
  const states = codes.map((c) => getBleedState(props.tyres[c].hotPressure, props.tyres[c].targetPressure))
  return {
    bleed: states.filter((s) => s === 'bleed').length,
    inflate: states.filter((s) => s === 'inflate').length,
    done: states.filter((s) => s === 'target').length,
  }
})

// Haptic feedback: a short tick per step (no-op where unsupported, e.g. iOS Safari)
function haptic() {
  if ('vibrate' in navigator) navigator.vibrate(8)
}

function adjustHot(delta: number) {
  currentTyre.value.hotPressure = Number(Math.max(10, currentTyre.value.hotPressure + delta).toFixed(1))
  haptic()
}

function setToTarget() {
  currentTyre.value.hotPressure = currentTyre.value.targetPressure
  if ('vibrate' in navigator) navigator.vibrate([20, 40, 20])
}

function adjustTarget(delta: number) {
  currentTyre.value.targetPressure = Number(Math.max(10, currentTyre.value.targetPressure + delta).toFixed(1))
  haptic()
}

function adjustTemp(delta: number) {
  currentTyre.value.temperature = Math.max(0, currentTyre.value.temperature + delta)
  haptic()
}

const hotFineDec = useHoldRepeat(() => adjustHot(-0.1))
const hotFineInc = useHoldRepeat(() => adjustHot(0.1))
const targetDec = useHoldRepeat(() => adjustTarget(-0.1))
const targetInc = useHoldRepeat(() => adjustTarget(0.1))
const tempDec = useHoldRepeat(() => adjustTemp(-1))
const tempInc = useHoldRepeat(() => adjustTemp(1))

// Screen wake lock: stops the phone dimming/locking while stood at the car
const wakeLockSupported = 'wakeLock' in navigator
const wakeLock = ref<WakeLockSentinel | null>(null)

async function toggleWakeLock() {
  if (wakeLock.value) {
    await wakeLock.value.release()
    wakeLock.value = null
    return
  }
  try {
    wakeLock.value = await navigator.wakeLock.request('screen')
    wakeLock.value.addEventListener('release', () => {
      wakeLock.value = null
    })
  } catch {
    wakeLock.value = null
  }
}

onBeforeUnmount(() => {
  wakeLock.value?.release()
})

const cornerLayout: { code: Corner; position: string; align: string }[] = [
  { code: 'FL', position: 'top-3 left-3', align: 'text-left' },
  { code: 'FR', position: 'top-3 right-3', align: 'text-right' },
  { code: 'RL', position: 'bottom-3 left-3', align: 'text-left' },
  { code: 'RR', position: 'bottom-3 right-3', align: 'text-right' },
]

const stepperBase =
  'rounded-xl border-[3px] border-black font-mono font-black select-none touch-none transition active:scale-95 active:bg-black active:text-white flex items-center justify-center'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-white text-black p-3 pb-10 max-w-md mx-auto">
    <!-- Header -->
    <header class="flex items-center justify-between py-2 border-b-[3px] border-black">
      <div>
        <span class="text-xs font-black uppercase tracking-wider">Sunlight Mode</span>
        <h1 class="text-xl font-black tracking-tight leading-tight">Brands Hatch Indy</h1>
      </div>
      <button
        v-if="wakeLockSupported"
        type="button"
        @click="toggleWakeLock"
        :class="[
          'px-3 py-2 rounded-lg border-[3px] border-black text-xs font-black uppercase',
          wakeLock ? 'bg-black text-white' : 'bg-white text-black',
        ]"
      >
        {{ wakeLock ? '● Screen On' : '○ Keep Screen On' }}
      </button>
    </header>

    <!-- Progress summary across all corners -->
    <div class="grid grid-cols-3 gap-2 mt-3 text-center text-sm font-black">
      <div class="py-1.5 rounded-lg border-[3px] border-black bg-yellow-300">▼ {{ summary.bleed }} BLEED</div>
      <div class="py-1.5 rounded-lg border-[3px] border-black bg-blue-800 text-white">▲ {{ summary.inflate }} ADD</div>
      <div class="py-1.5 rounded-lg border-[3px] border-black bg-green-800 text-white">✓ {{ summary.done }} DONE</div>
    </div>

    <!-- Chassis map -->
    <div class="relative mt-3 h-72 rounded-2xl border-[3px] border-black bg-white">
      <!-- Car outline -->
      <div class="absolute inset-y-6 left-1/2 -translate-x-1/2 w-24 border-[3px] border-black rounded-[2.5rem] flex flex-col items-center justify-between py-3">
        <div class="w-12 h-6 border-b-[3px] border-black rounded-b-xl"></div>
        <div class="text-[11px] font-black tracking-widest">FRONT ▲</div>
        <div class="w-14 h-5 border-t-[3px] border-black rounded-t-lg"></div>
      </div>

      <!-- Corner cards -->
      <button
        v-for="corner in cornerLayout"
        :key="corner.code"
        type="button"
        @click="activeCorner = corner.code"
        :aria-pressed="activeCorner === corner.code"
        :class="[
          'absolute w-[8.5rem] p-2 rounded-xl border-[3px] border-black transition',
          corner.position,
          corner.align,
          activeCorner === corner.code ? 'bg-black text-white' : 'bg-white text-black',
        ]"
      >
        <div class="flex items-center justify-between text-sm font-black">
          <span>{{ corner.code }}</span>
          <span>{{ tyres[corner.code].temperature }}°C</span>
        </div>
        <div class="text-3xl font-black font-mono leading-none mt-1">
          {{ tyres[corner.code].hotPressure.toFixed(1) }}
        </div>
        <div
          :class="[
            'mt-1.5 px-1.5 py-0.5 rounded-md border-2 text-xs font-black font-mono text-center',
            getBleedInfo(tyres[corner.code].hotPressure, tyres[corner.code].targetPressure).classes,
          ]"
        >
          {{ getBleedInfo(tyres[corner.code].hotPressure, tyres[corner.code].targetPressure).icon }}
          {{ getBleedInfo(tyres[corner.code].hotPressure, tyres[corner.code].targetPressure).short }}
        </div>
      </button>
    </div>

    <!-- Active corner panel -->
    <section class="mt-3 rounded-2xl border-[3px] border-black p-3">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-black">{{ currentCorner.name }}</h2>
        <span class="text-lg font-black font-mono px-2 py-0.5 bg-black text-white rounded-md">{{ currentCorner.code }}</span>
      </div>

      <!-- Big status bar -->
      <div
        :class="[
          'mt-2 py-2 rounded-xl border-[3px] text-center text-2xl font-black font-mono',
          getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).classes,
        ]"
      >
        {{ getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).icon }}
        {{ getBleedInfo(currentTyre.hotPressure, currentTyre.targetPressure).long }}
      </div>

      <!-- Hot pressure readout -->
      <div class="mt-3 text-center">
        <div class="text-sm font-black uppercase tracking-wider">Hot Pressure</div>
        <div class="text-6xl font-black font-mono leading-none mt-1">
          {{ currentTyre.hotPressure.toFixed(1) }}<span class="text-2xl ml-1">PSI</span>
        </div>
      </div>

      <!-- Fine steppers (hold to repeat) -->
      <div class="grid grid-cols-2 gap-2 mt-3">
        <button type="button" v-on="hotFineDec.handlers" aria-label="Decrease hot pressure by 0.1 PSI" :class="[stepperBase, 'h-16 text-2xl bg-white']">−0.1</button>
        <button type="button" v-on="hotFineInc.handlers" aria-label="Increase hot pressure by 0.1 PSI" :class="[stepperBase, 'h-16 text-2xl bg-white']">+0.1</button>
      </div>

      <!-- Coarse steppers -->
      <div class="grid grid-cols-4 gap-2 mt-2">
        <button type="button" @click="adjustHot(-1)" :class="[stepperBase, 'h-14 text-lg bg-white']">−1.0</button>
        <button type="button" @click="adjustHot(-0.5)" :class="[stepperBase, 'h-14 text-lg bg-white']">−0.5</button>
        <button type="button" @click="adjustHot(0.5)" :class="[stepperBase, 'h-14 text-lg bg-white']">+0.5</button>
        <button type="button" @click="adjustHot(1)" :class="[stepperBase, 'h-14 text-lg bg-white']">+1.0</button>
      </div>

      <button
        type="button"
        @click="setToTarget"
        class="w-full mt-2 h-14 rounded-xl border-[3px] border-black bg-black text-white text-base font-black uppercase tracking-wide active:scale-95 select-none"
      >
        Set to target · {{ currentTyre.targetPressure.toFixed(1) }} PSI
      </button>

      <!-- Target & temperature -->
      <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t-[3px] border-black">
        <div class="rounded-xl border-[3px] border-black p-2">
          <div class="text-xs font-black uppercase">Target Hot</div>
          <div class="text-2xl font-black font-mono">{{ currentTyre.targetPressure.toFixed(1) }}</div>
          <div class="grid grid-cols-2 gap-1.5 mt-1">
            <button type="button" v-on="targetDec.handlers" aria-label="Decrease target hot pressure" :class="[stepperBase, 'h-12 text-2xl bg-white']">−</button>
            <button type="button" v-on="targetInc.handlers" aria-label="Increase target hot pressure" :class="[stepperBase, 'h-12 text-2xl bg-white']">+</button>
          </div>
        </div>
        <div class="rounded-xl border-[3px] border-black p-2">
          <div class="text-xs font-black uppercase">Tyre Temp</div>
          <div class="text-2xl font-black font-mono">{{ currentTyre.temperature }}°C</div>
          <div class="grid grid-cols-2 gap-1.5 mt-1">
            <button type="button" v-on="tempDec.handlers" aria-label="Decrease tyre temperature" :class="[stepperBase, 'h-12 text-2xl bg-white']">−</button>
            <button type="button" v-on="tempInc.handlers" aria-label="Increase tyre temperature" :class="[stepperBase, 'h-12 text-2xl bg-white']">+</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
