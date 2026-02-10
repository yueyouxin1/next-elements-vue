<script setup lang="ts">
import { computed } from "vue"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
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

const selectedKey = computed(() => {
  const index = resolvedOptions.value.findIndex((option) => Object.is(option.value, props.modelValue))
  return index >= 0 ? String(index) : ""
})

const placeholder = computed(() => String(props.fieldProps?.placeholder ?? "请选择"))

function onUpdateModelValue(optionIndex: unknown): void {
  if (optionIndex === null || optionIndex === undefined || optionIndex === "") {
    emit("update:modelValue", undefined)
    return
  }

  const option = resolvedOptions.value[Number(optionIndex)]
  emit("update:modelValue", option?.value)
}
</script>

<template>
  <Select
    :model-value="selectedKey"
    :disabled="disabled || Boolean(fieldProps?.disabled)"
    @update:model-value="onUpdateModelValue"
  >
    <SelectTrigger :class="fieldProps?.triggerClass as string">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent :class="fieldProps?.contentClass as string">
      <SelectItem
        v-for="(option, index) in resolvedOptions"
        :key="`${option.value}-${index}`"
        :value="String(index)"
        :disabled="Boolean(option.disabled)"
      >
        {{ option.label ?? option.value }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
