<script setup lang="ts">
import { computed } from "vue"
import { Input } from "@repo/ui-shadcn/components/ui/input"

type DateRangeValue = {
  start?: string
  end?: string
}

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const normalizedRange = computed<DateRangeValue>(() => {
  if (Array.isArray(props.modelValue)) {
    return {
      start: props.modelValue[0] ? String(props.modelValue[0]) : "",
      end: props.modelValue[1] ? String(props.modelValue[1]) : "",
    }
  }

  if (props.modelValue && typeof props.modelValue === "object") {
    const value = props.modelValue as DateRangeValue
    return {
      start: value.start ?? "",
      end: value.end ?? "",
    }
  }

  return { start: "", end: "" }
})

function patchRange(next: Partial<DateRangeValue>): void {
  emit("update:modelValue", {
    ...normalizedRange.value,
    ...next,
  })
}
</script>

<template>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    <Input
      :type="String(fieldProps?.pickerType ?? 'date')"
      :model-value="normalizedRange.start"
      :disabled="disabled || Boolean(fieldProps?.disabled)"
      @update:model-value="(value) => patchRange({ start: String(value ?? '') })"
    />
    <Input
      :type="String(fieldProps?.pickerType ?? 'date')"
      :model-value="normalizedRange.end"
      :disabled="disabled || Boolean(fieldProps?.disabled)"
      @update:model-value="(value) => patchRange({ end: String(value ?? '') })"
    />
  </div>
</template>

