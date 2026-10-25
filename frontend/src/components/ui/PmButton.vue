<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "outline" | "danger";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
  }
);

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-bold tracking-wide transition select-none active:scale-98 disabled:pointer-events-none disabled:opacity-50',
      variant === 'primary'
        ? 'bg-[#d4f933] text-black shadow-sm hover:bg-[#c4f02a]'
        : variant === 'secondary'
          ? 'border border-[#2d3748] bg-[#1c2330] text-white hover:bg-[#252f40]'
          : variant === 'outline'
            ? 'border-2 border-[#2d3748] bg-transparent text-white hover:border-white'
            : 'bg-red-600 text-white hover:bg-red-700',
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
