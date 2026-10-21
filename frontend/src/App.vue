<!--
  PaddockMate: Pit-Lane Tyre Pressure Logging
  UI PROTOTYPE: compares the validated dark chassis view (Variant A) against a
  high-contrast Sunlight variant for bright outdoor conditions.
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { createInitialTyresState } from './prototype/types'
import VariantA from './prototype/VariantA.vue'
import VariantSunlight from './prototype/VariantSunlight.vue'

type Theme = 'dark' | 'sunlight'

const theme = ref<Theme>('sunlight')
const showStateDrawer = ref(false)

// Shared state so values persist when switching themes
const tyresState = reactive(createInitialTyresState())

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'sunlight' : 'dark'
  localStorage.setItem('paddockmate_theme', theme.value)
  const url = new URL(window.location.href)
  url.searchParams.set('theme', theme.value)
  window.history.replaceState({}, '', url.toString())
}

onMounted(() => {
  const urlTheme = new URLSearchParams(window.location.search).get('theme') as Theme | null
  const storedTheme = localStorage.getItem('paddockmate_theme') as Theme | null
  if (urlTheme && (urlTheme === 'dark' || urlTheme === 'sunlight')) {
    theme.value = urlTheme
  } else if (storedTheme && (storedTheme === 'dark' || storedTheme === 'sunlight')) {
    theme.value = storedTheme
  }
})
</script>

<template>
  <div
    :class="[
      'min-h-screen font-sans',
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-black',
    ]"
  >
    <!-- Top Bar: App Branding, Theme Toggle & Live State Inspector -->
    <header
      :class="[
        'px-4 py-2 flex items-center justify-between text-xs gap-2',
        theme === 'dark' ? 'bg-slate-900 border-b border-slate-800' : 'bg-black text-white',
      ]"
    >
      <span class="font-bold tracking-wide">PADDOCKMATE</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="toggleTheme"
          :class="[
            'px-3 py-1.5 rounded font-bold text-[12px] border transition',
            theme === 'dark'
              ? 'bg-amber-400 text-black border-amber-300'
              : 'bg-white text-black border-white',
          ]"
        >
          {{ theme === 'dark' ? '☀ Sunlight' : '☾ Dark' }}
        </button>
        <button
          type="button"
          @click="showStateDrawer = !showStateDrawer"
          class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-700 transition"
        >
          {{ showStateDrawer ? 'State ▲' : 'State ▼' }}
        </button>
      </div>
    </header>

    <!-- Live State Drawer -->
    <div
      v-if="showStateDrawer"
      class="bg-slate-900 border-b border-slate-800 p-4 font-mono text-xs text-slate-300 max-w-md mx-auto"
    >
      <div class="text-[10px] uppercase font-bold text-slate-400 mb-2">Live In-Memory Tyres State:</div>
      <div class="grid grid-cols-2 gap-2 text-[11px]">
        <div v-for="(tyre, code) in tyresState" :key="code" class="bg-slate-950 p-2 rounded border border-slate-800">
          <div class="font-bold text-amber-400">{{ code }}:</div>
          <div>Cold: {{ tyre.coldPressure }} PSI</div>
          <div>Hot: <span class="text-white font-bold">{{ tyre.hotPressure }} PSI</span></div>
          <div>Target: {{ tyre.targetPressure }} PSI</div>
          <div>Bleed: {{ (tyre.hotPressure - tyre.targetPressure).toFixed(1) }} PSI</div>
          <div>Temp: {{ tyre.temperature }}°C</div>
        </div>
      </div>
    </div>

    <main>
      <VariantA v-if="theme === 'dark'" :tyres="tyresState" />
      <VariantSunlight v-else :tyres="tyresState" />
    </main>
  </div>
</template>
