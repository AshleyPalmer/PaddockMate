<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string | number | undefined;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }>(),
  {
    label: undefined,
    type: "text",
    placeholder: "",
    error: "",
    required: false,
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-black tracking-wider text-gray-400 uppercase">
      {{ label }} <span v-if="required" class="text-[#d4f933]">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :class="[
        'min-h-[48px] w-full rounded-xl border bg-[#0b0f17] px-4 py-2.5 text-base font-medium text-white transition placeholder:text-gray-600 focus:outline-none',
        error
          ? 'border-red-500 focus:ring-1 focus:ring-red-500'
          : 'border-[#2d3748] focus:border-[#d4f933] focus:ring-1 focus:ring-[#d4f933]',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="text-xs font-bold text-red-400">{{ error }}</span>
  </div>
</template>
