<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Input } from "@repo/ui-shadcn/components/ui/input"

const props = withDefaults(defineProps<{
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>(), {
  modelValue: 0,
  min: Number.NEGATIVE_INFINITY,
  max: Number.POSITIVE_INFINITY,
  step: 1,
})

const emit = defineEmits<{
  (event: "update:modelValue", value: number): void
}>()

const currentValue = computed(() => {
  return typeof props.modelValue === "number" ? props.modelValue : 0
})

const clampValue = (value: number): number => {
  return Math.min(props.max, Math.max(props.min, value))
}

const updateValue = (value: number): void => {
  emit("update:modelValue", clampValue(value))
}

const handleDecrease = () => {
  if (props.disabled) {
    return
  }
  updateValue(currentValue.value - props.step)
}

const handleIncrease = () => {
  if (props.disabled) {
    return
  }
  updateValue(currentValue.value + props.step)
}

const handleInput = (value: string | number) => {
  const nextValue = Number(value)
  if (Number.isNaN(nextValue)) {
    return
  }
  updateValue(nextValue)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      :disabled="disabled"
      @click="handleDecrease"
    >
      -
    </Button>
    <Input
      type="number"
      class="w-24 text-center"
      :disabled="disabled"
      :model-value="currentValue"
      @update:model-value="handleInput"
    />
    <Button
      type="button"
      variant="outline"
      :disabled="disabled"
      @click="handleIncrease"
    >
      +
    </Button>
  </div>
</template>
