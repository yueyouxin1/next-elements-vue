<script setup lang="ts">
import { computed } from "vue"
import { Switch } from "@repo/ui-shadcn/components/ui/switch"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const label = computed(() => props.fieldProps?.label)
</script>

<template>
  <label class="flex items-center gap-2 text-sm">
    <Switch
      v-bind="fieldProps"
      :model-value="Boolean(modelValue)"
      :disabled="disabled || Boolean(fieldProps?.disabled)"
      @update:model-value="(next) => emit('update:modelValue', Boolean(next))"
    />
    <span v-if="label">{{ String(label) }}</span>
  </label>
</template>

