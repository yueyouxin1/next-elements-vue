<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import WorkflowStudio from "@repo/workflow/playground/src/editor/WorkflowStudio.vue"
import type { WorkflowStudioMode } from "@repo/workflow"

const mode = ref<WorkflowStudioMode>("default")

const modeOptions: Array<{ label: string; value: WorkflowStudioMode }> = [
  { label: "默认", value: "default" },
  { label: "只读", value: "readonly" },
  { label: "禁用", value: "disabled" },
  { label: "加载中", value: "loading" },
  { label: "错误态", value: "error" },
  { label: "空态", value: "empty" },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="w-40">
        <Select v-model="mode">
          <SelectTrigger>
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in modeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" @click="mode = 'default'">
        重置默认状态
      </Button>
    </div>

    <WorkflowStudio :mode="mode" />
  </div>
</template>
