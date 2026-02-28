<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import type { WorkflowCanvasNodeData } from "../base/types"
import { computed } from "vue"
import { Handle, Position } from "@vue-flow/core"
import { CheckCircle2, CircleDashed, LoaderCircle, MinusCircle, MoreHorizontal, XCircle } from "lucide-vue-next"
import { cn } from "@repo/ui-shadcn/lib/utils"
import { workflowNodeRegistry } from "../nodes/registry"

const props = defineProps<NodeProps<WorkflowCanvasNodeData>>()

const meta = computed(() => workflowNodeRegistry[props.data.registryId])

const statusText = computed(() => {
  switch (props.data.status) {
    case "RUNNING":
      return "运行中"
    case "COMPLETED":
      return "已完成"
    case "FAILED":
      return "失败"
    case "SKIPPED":
      return "跳过"
    default:
      return "未执行"
  }
})

const statusIconClass = computed(() => {
  switch (props.data.status) {
    case "RUNNING":
      return "text-emerald-600"
    case "COMPLETED":
      return "text-emerald-600"
    case "FAILED":
      return "text-red-600"
    case "SKIPPED":
      return "text-slate-500"
    default:
      return "text-slate-400"
  }
})

const iconClass = computed(() => {
  switch (props.data.registryId) {
    case "Start":
    case "End":
      return "bg-indigo-100 text-indigo-600"
    case "Branch":
      return "bg-emerald-100 text-emerald-600"
    case "ToolNode":
      return "bg-sky-100 text-sky-600"
    case "AgentNode":
      return "bg-cyan-100 text-cyan-600"
    case "LLMNode":
      return "bg-violet-100 text-violet-600"
    case "Loop":
      return "bg-emerald-100 text-emerald-600"
    default:
      return "bg-slate-100 text-slate-600"
  }
})

const statusClass = computed(() => {
  switch (props.data.status) {
    case "RUNNING":
      return "border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.14)]"
    case "COMPLETED":
      return "border-emerald-300"
    case "FAILED":
      return "border-red-300"
    case "SKIPPED":
      return "border-slate-300 opacity-70"
    default:
      return "border-slate-200"
  }
})

const inputText = computed(() => {
  if (props.data.inputs.length === 0) {
    return "无"
  }
  return props.data.inputs
    .slice(0, 3)
    .map(item => item.name)
    .join("    ")
})

const outputText = computed(() => {
  if (props.data.outputs.length === 0) {
    return "无"
  }
  return props.data.outputs
    .slice(0, 3)
    .map(item => item.name)
    .join("    ")
})

const shortLabel = computed(() => {
  const label = meta.value.label.trim()
  return label.slice(0, 1).toUpperCase()
})
</script>

<template>
  <article
    :class="cn(
      'workflow-node w-[276px] rounded-[10px] border bg-white shadow-[0_2px_6px_rgba(15,23,42,0.08)] transition',
      statusClass,
      selected ? 'border-[#5865f2] shadow-[0_0_0_2px_rgba(88,101,242,0.18)]' : '',
      data.muted ? 'opacity-60' : '',
    )"
  >
    <header class="flex items-center justify-between rounded-t-[10px] border-b border-slate-200 px-3 py-2">
      <div class="flex min-w-0 items-center gap-2">
        <span :class="cn('inline-flex size-[18px] items-center justify-center rounded-[4px] text-[10px] font-semibold', iconClass)">
          {{ shortLabel }}
        </span>
        <span class="truncate text-[13px] font-semibold text-slate-900">{{ data.name }}</span>
      </div>
      <MoreHorizontal class="size-3.5 text-slate-400" />
    </header>

    <div class="space-y-1.5 px-3 pb-2.5 pt-2">
      <div class="flex items-start gap-1 text-[10px] leading-4 text-slate-500">
        <span class="shrink-0 text-slate-400">输入</span>
        <span class="line-clamp-1 break-all">{{ inputText }}</span>
      </div>
      <div class="flex items-start gap-1 text-[10px] leading-4 text-slate-500">
        <span class="shrink-0 text-slate-400">输出</span>
        <span class="line-clamp-1 break-all">{{ outputText }}</span>
      </div>

      <div class="flex items-center justify-between border-t border-slate-100 pt-1.5">
        <div class="line-clamp-1 text-[10px] text-slate-400">
          {{ data.subtitle || data.description || meta.description }}
        </div>
        <span class="inline-flex items-center gap-1 text-[10px]" :class="statusIconClass">
          <LoaderCircle v-if="data.status === 'RUNNING'" class="size-3 animate-spin" />
          <CheckCircle2 v-else-if="data.status === 'COMPLETED'" class="size-3" />
          <XCircle v-else-if="data.status === 'FAILED'" class="size-3" />
          <MinusCircle v-else-if="data.status === 'SKIPPED'" class="size-3" />
          <CircleDashed v-else class="size-3" />
          {{ statusText }}
        </span>
      </div>
    </div>

    <Handle
      id="target"
      type="target"
      :position="Position.Left"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />
    <Handle
      id="source"
      type="source"
      :position="Position.Right"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />
    <Handle
      v-if="data.registryId === 'Loop'"
      id="loop-body-source"
      type="source"
      :position="Position.Bottom"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />
  </article>
</template>

<style scoped>
.workflow-node {
  backdrop-filter: blur(2px);
}
</style>
