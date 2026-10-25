<script setup lang="ts">
defineProps<{
  selected?: boolean;
}>();
</script>

<template>
  <div
    :class="[
      'rounded-2xl border p-4 transition',
      selected
        ? 'border-[#d4f933] bg-[#161b22] ring-1 ring-[#d4f933]'
        : 'border-[#2d3748] bg-[#161b22] hover:border-[#4b5563]',
    ]"
  >
    <slot />
  </div>
</template>
