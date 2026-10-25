<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useThemeStore } from "../../stores/themeStore";

const themeStore = useThemeStore();

const isDark = computed(() => themeStore.isDark);
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-[#2d3748] bg-[#0b0f17]/95 px-4 py-2.5 backdrop-blur-md transition-colors [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-white/95"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <!-- Left: PaddockMate Brand Logo -->
      <div class="flex items-center gap-3">
        <RouterLink
          to="/"
          data-testid="header-logo-link"
          class="flex min-h-[48px] items-center gap-2.5 rounded-lg py-1 transition select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4f933]"
          aria-label="PADDOCKMATE Home"
        >
          <div class="flex items-center gap-1" aria-hidden="true">
            <span class="h-6 w-1.5 rounded-full bg-[#d4f933] [data-theme=sunlight]:bg-black"></span>
            <span class="h-6 w-1.5 rounded-full bg-[#d4f933] [data-theme=sunlight]:bg-black"></span>
          </div>
          <span
            class="font-mono text-xl font-black tracking-widest text-white [data-theme=sunlight]:text-black"
          >
            PADDOCKMATE
          </span>
        </RouterLink>

        <!-- Offline Sync Status Pill -->
        <div
          data-testid="sync-status-pill"
          class="hidden items-center gap-1.5 rounded-full border border-[#2d3748] bg-[#161b22] px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-[#d4f933] sm:inline-flex [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-gray-100 [data-theme=sunlight]:text-black"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-[#d4f933] [data-theme=sunlight]:bg-black"></span>
          <span>OFFLINE READY / 0 CHANGES PENDING</span>
        </div>
      </div>

      <!-- Right: Navigation Links & Theme Toggle -->
      <nav aria-label="Main Navigation" class="flex items-center gap-2 sm:gap-3">
        <!-- Navigation Links -->
        <RouterLink
          to="/vehicles"
          data-testid="nav-link-garage"
          class="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl px-3 text-xs font-black tracking-wider text-gray-300 uppercase transition hover:text-white [data-theme=sunlight]:text-gray-700 [data-theme=sunlight]:hover:text-black"
          active-class="text-[#d4f933] [data-theme=sunlight]:text-black"
        >
          Garage
        </RouterLink>

        <RouterLink
          to="/track-days/new"
          data-testid="nav-link-track-day"
          class="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl px-3 text-xs font-black tracking-wider text-gray-300 uppercase transition hover:text-white [data-theme=sunlight]:text-gray-700 [data-theme=sunlight]:hover:text-black"
          active-class="text-[#d4f933] [data-theme=sunlight]:text-black"
        >
          Track Day
        </RouterLink>

        <RouterLink
          to="/login"
          data-testid="nav-link-login"
          class="flex min-h-[48px] min-w-[48px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black tracking-wider text-gray-300 uppercase transition hover:text-white [data-theme=sunlight]:text-gray-700 [data-theme=sunlight]:hover:text-black"
          active-class="text-[#d4f933] [data-theme=sunlight]:text-black"
          aria-label="Driver Login Profile"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-md border border-[#2d3748] bg-[#1c2330] font-mono text-[10px] font-black text-[#d4f933] [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-black [data-theme=sunlight]:text-white"
            aria-hidden="true"
          >
            AP
          </div>
          <span class="hidden sm:inline">Login</span>
        </RouterLink>

        <!-- Theme Toggle Button -->
        <button
          type="button"
          data-testid="theme-toggle"
          class="flex min-h-[48px] min-w-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#2d3748] bg-[#161b22] px-3 font-mono text-xs font-black tracking-wider text-white transition hover:border-[#d4f933] active:scale-95 [data-theme=sunlight]:border-black [data-theme=sunlight]:bg-gray-100 [data-theme=sunlight]:text-black"
          :aria-label="isDark ? 'Switch to Sunlight mode' : 'Switch to Dark mode'"
          @click="themeStore.toggleTheme"
        >
          <span v-if="isDark">☀ Sunlight</span>
          <span v-else>☾ Dark</span>
        </button>
      </nav>
    </div>
  </header>
</template>
