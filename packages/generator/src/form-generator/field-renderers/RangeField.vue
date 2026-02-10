<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const min = computed(() => Number(props.fieldProps?.min ?? 0))
const max = computed(() => Number(props.fieldProps?.max ?? 100))
const step = computed(() => Number(props.fieldProps?.step ?? 1))
const value = computed(() => {
  const normalized = Number(props.modelValue ?? min.value)
  return Number.isNaN(normalized) ? min.value : normalized
})
</script>

<template>
  <div class="space-y-2">
    <input
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      type="range"
      class="w-full"
      :disabled="disabled || Boolean(fieldProps?.disabled)"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    >
    <div class="text-xs text-muted-foreground">
      {{ value }}
    </div>
  </div>
</template>

