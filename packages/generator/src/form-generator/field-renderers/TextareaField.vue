<script setup lang="ts">
import { computed } from "vue"
import { Textarea } from "@repo/ui-shadcn/components/ui/textarea"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const normalizedValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return ""
  }
  return String(props.modelValue)
})
</script>

<template>
  <Textarea
    v-bind="fieldProps"
    :disabled="disabled || Boolean(fieldProps?.disabled)"
    :model-value="normalizedValue"
    @update:model-value="(next) => emit('update:modelValue', next)"
  />
</template>

