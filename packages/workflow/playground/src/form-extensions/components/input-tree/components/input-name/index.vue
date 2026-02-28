<script setup lang="ts">
import { computed } from "vue"
import { Input } from "@repo/ui-shadcn/components/ui/input"
import type { TreeNodeCustomData } from "../../types"

const props = withDefaults(defineProps<{
  data: TreeNodeCustomData
  disabled?: boolean
  isPureText?: boolean
  error?: boolean
  style?: Record<string, string>
  testName?: string
}>(), {
  disabled: false,
  isPureText: false,
  error: false,
  style: () => ({}),
  testName: "",
})

const emit = defineEmits<{
  (event: "update", value: string): void
}>()

const inputClass = computed(() => {
  if (props.error) {
    return "border-red-300 ring-red-100"
  }
  return ""
})
</script>

<template>
  <div class="relative flex min-w-0 flex-1 flex-col self-stretch" :style="style">
    <p
      v-if="isPureText"
      class="h-8 truncate rounded-md border border-transparent px-3 py-1 text-sm leading-6 text-slate-700"
      :data-testid="`${testName}/name-text`"
    >
      {{ data.name }}
    </p>
    <Input
      v-else
      :model-value="data.name"
      :disabled="disabled"
      class="h-8 min-w-0 text-sm"
      :class="inputClass"
      :data-testid="`${testName}/name`"
      @update:model-value="value => emit('update', String(value ?? ''))"
    />
  </div>
</template>
