<script setup lang="ts">
import AppHeader from "./components/layout/AppHeader.vue";
</script>

<template>
  <div
    class="min-h-screen bg-[#0b0f17] text-white [data-theme=sunlight]:bg-white [data-theme=sunlight]:text-black"
  >
    <AppHeader />
    <main>
      <router-view />
    </main>
  </div>
</template>
