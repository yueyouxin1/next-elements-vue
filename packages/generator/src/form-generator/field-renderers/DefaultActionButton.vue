<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@repo/ui-shadcn/components/ui/button"

const props = defineProps<{
  label?: string
  disabled?: boolean
  actionProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "click"): void
}>()

const buttonLabel = computed(() => {
  if (props.label) {
    return props.label
  }
  if (props.actionProps?.label) {
    return String(props.actionProps.label)
  }
  return "Action"
})
</script>

<template>
  <Button
    type="button"
    v-bind="actionProps"
    :disabled="disabled || Boolean(actionProps?.disabled)"
    @click="emit('click')"
  >
    {{ buttonLabel }}
  </Button>
</template>

