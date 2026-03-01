<script setup lang="ts">
import { Play } from "lucide-vue-next"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import { Textarea } from "@repo/ui-shadcn/components/ui/textarea"
import type { QueryExample } from "./mock"

const props = withDefaults(defineProps<{
  modelValue: string
  examples: QueryExample[]
  activeExampleId?: string
  runState: "idle" | "active" | "loading" | "success" | "error"
}>(), {
  activeExampleId: "",
})

const emit = defineEmits<{
  "update:modelValue": [value: string]
  run: []
  "pick-example": [id: string]
}>()
</script>

<template>
  <section class="flex h-full flex-col bg-background">
    <div class="flex items-center gap-2 border-b border-border px-3 py-2">
      <p class="text-[13px] font-medium">
        SQL Editor
      </p>
      <span class="ml-auto text-[11px] text-muted-foreground">
        Ctrl/Cmd + Enter
      </span>
    </div>

    <div class="flex items-center gap-2 border-b border-border px-3 py-2">
      <Select :model-value="activeExampleId" @update:model-value="(value) => emit('pick-example', String(value))">
        <SelectTrigger class="h-8 w-64 text-xs">
          <SelectValue placeholder="选择查询示例" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="example in examples" :key="example.id" :value="example.id">
            {{ example.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        :disabled="runState === 'loading'"
        class="h-8 gap-1.5 text-xs"
        @click="emit('run')"
      >
        <Play class="size-3.5" />
        Run Query
      </Button>
    </div>

    <div class="min-h-0 flex-1 p-3">
      <Textarea
        :model-value="modelValue"
        class="h-full w-full resize-none rounded-md border-border bg-muted/20 font-mono text-[13px] leading-6"
        placeholder="输入 SQL，例如: select * from users limit 20;"
        @update:model-value="(value) => emit('update:modelValue', String(value))"
      />
    </div>
  </section>
</template>
