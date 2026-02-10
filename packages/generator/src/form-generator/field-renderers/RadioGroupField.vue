<script setup lang="ts">
import { computed } from "vue"
import type { FieldOption } from "../types"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
  options?: FieldOption[]
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const resolvedOptions = computed(() => props.options ?? [])
</script>

<template>
  <div class="space-y-2">
    <label
      v-for="(option, index) in resolvedOptions"
      :key="`${option.value}-${index}`"
      class="flex items-center gap-2 text-sm"
    >
      <input
        type="radio"
        :name="String(fieldProps?.name ?? 'form-radio-group')"
        :disabled="disabled || Boolean(fieldProps?.disabled) || Boolean(option.disabled)"
        :checked="Object.is(modelValue, option.value)"
        @change="emit('update:modelValue', option.value)"
      >
      <span>{{ option.label ?? option.value }}</span>
    </label>
  </div>
</template>

