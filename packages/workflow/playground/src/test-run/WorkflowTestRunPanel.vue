<script setup lang="ts">
import type { WorkflowRunEvent, WorkflowValidationIssue } from "../../../src/base"
import { computed } from "vue"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"

const props = defineProps<{
  running: boolean
  events: WorkflowRunEvent[]
  issues: WorkflowValidationIssue[]
}>()

const statusText = computed(() => (props.running ? "运行中" : "待命"))

function getEventClass(eventName: WorkflowRunEvent["event"]): string {
  switch (eventName) {
    case "node_error":
      return "text-red-600"
    case "node_finish":
      return "text-emerald-600"
    case "node_start":
      return "text-blue-600"
    case "finish":
      return "text-indigo-600"
    default:
      return "text-slate-500"
  }
}
</script>

<template>
  <section class="flex h-full flex-col overflow-hidden rounded-xl border border-[#dce2ee] bg-white/95 shadow-[0_2px_10px_rgba(15,23,42,0.06)] backdrop-blur">
    <header class="flex items-center justify-between border-b border-[#e7ebf4] px-3 py-2">
      <div class="text-sm font-semibold text-slate-800">
        试运行日志
      </div>
      <Badge :variant="running ? 'default' : 'secondary'" class="text-[10px]">
        {{ statusText }}
      </Badge>
    </header>

    <div class="max-h-40 flex-1 overflow-auto px-3 py-2">
      <ul class="space-y-1">
        <li
          v-for="item in events"
          :key="`${item.event}-${item.timestamp}-${item.nodeId ?? ''}`"
          class="rounded border border-slate-100 bg-slate-50 px-2 py-1"
        >
          <div class="flex items-center justify-between gap-2">
            <span :class="['text-xs font-medium', getEventClass(item.event)]">{{ item.event }}</span>
            <span class="text-[10px] text-slate-400">{{ new Date(item.timestamp).toLocaleTimeString([], { hour12: false }) }}</span>
          </div>
          <div class="truncate text-[11px] text-slate-500">
            {{ item.nodeId ?? "workflow" }}
          </div>
        </li>
        <li v-if="events.length === 0" class="text-xs text-slate-400">
          暂无运行日志。
        </li>
      </ul>
    </div>

    <footer class="border-t border-[#e7ebf4] px-3 py-2">
      <p class="text-xs text-slate-500">
        校验结果：{{ issues.length === 0 ? "通过" : `发现 ${issues.length} 项` }}
      </p>
      <ul v-if="issues.length > 0" class="mt-1 space-y-1 text-[11px] text-amber-600">
        <li v-for="issue in issues" :key="issue.code + issue.message">
          {{ issue.message }}
        </li>
      </ul>
    </footer>
  </section>
</template>
