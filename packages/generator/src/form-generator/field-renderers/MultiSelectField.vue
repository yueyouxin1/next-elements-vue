<script setup lang="ts">
import { computed } from "vue"
import { Checkbox } from "@repo/ui-shadcn/components/ui/checkbox"
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

const selectedValues = computed<unknown[]>(() => (
  Array.isArray(props.modelValue) ? props.modelValue : []
))
const resolvedOptions = computed(() => props.options ?? [])

function toggleOption(option: FieldOption, enabled: boolean | "indeterminate"): void {
  const checked = enabled === true || enabled === "indeterminate"
  const current = selectedValues.value

  if (checked) {
    if (current.some((value) => Object.is(value, option.value))) {
      emit("update:modelValue", current)
      return
    }
    emit("update:modelValue", [...current, option.value])
    return
  }

  emit(
    "update:modelValue",
    current.filter((value) => !Object.is(value, option.value)),
  )
}
</script>

<template>
  <div class="space-y-2">
    <label
      v-for="(option, index) in resolvedOptions"
      :key="`${option.value}-${index}`"
      class="flex items-center gap-2 text-sm"
    >
      <Checkbox
        :model-value="selectedValues.some((value) => Object.is(value, option.value))"
        :disabled="disabled || Boolean(fieldProps?.disabled) || Boolean(option.disabled)"
        @update:model-value="(value) => toggleOption(option, value)"
      />
      <span>{{ option.label ?? option.value }}</span>
    </label>
  </div>
</template>

