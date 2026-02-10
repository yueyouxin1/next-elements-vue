<script setup lang="ts">
import { computed } from "vue"
import { Input } from "@repo/ui-shadcn/components/ui/input"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const inputType = computed(() => String(props.fieldProps?.type ?? "text"))
const normalizedValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return ""
  }
  if (typeof props.modelValue === "number") {
    return props.modelValue
  }
  return String(props.modelValue)
})

function onUpdateModelValue(next: string | number): void {
  if (inputType.value === "number") {
    if (next === "") {
      emit("update:modelValue", undefined)
      return
    }
    const parsed = Number(next)
    emit("update:modelValue", Number.isNaN(parsed) ? undefined : parsed)
    return
  }
  emit("update:modelValue", next)
}
</script>

<template>
  <Input
    v-bind="fieldProps"
    :type="inputType"
    :disabled="disabled || Boolean(fieldProps?.disabled)"
    :model-value="normalizedValue"
    @update:model-value="onUpdateModelValue"
  />
</template>

