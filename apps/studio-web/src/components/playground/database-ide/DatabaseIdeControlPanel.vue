<script setup lang="ts">
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import type { DemoScenario, ScenarioDescriptor } from "./mock"

const props = defineProps<{
  modelValue: DemoScenario
  descriptors: Record<DemoScenario, ScenarioDescriptor>
}>()

const emit = defineEmits<{
  "update:modelValue": [value: DemoScenario]
  reset: []
}>()

const scenarioValues: DemoScenario[] = ["default", "empty", "error", "edge"]
</script>

<template>
  <section class="rounded-lg border border-border bg-card p-3">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-muted-foreground">场景控制</span>
      <Select :model-value="modelValue" @update:model-value="(value) => emit('update:modelValue', value as DemoScenario)">
        <SelectTrigger class="h-8 w-44 text-xs">
          <SelectValue placeholder="选择场景" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="scenario in scenarioValues" :key="scenario" :value="scenario">
            {{ descriptors[scenario].label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" class="h-8 text-xs" @click="emit('reset')">
        重置演示
      </Button>
      <p class="text-xs text-muted-foreground">
        {{ descriptors[modelValue].description }}
      </p>
    </div>
  </section>
</template>
