<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import type { WorkflowCanvasNodeData } from "../base/types"

defineProps<NodeProps<WorkflowCanvasNodeData>>()
</script>

<template>
  <section class="workflow-group h-full w-full rounded-[10px] border border-[#dce1ea] bg-[#f8f9fd] p-5">
    <div class="inline-flex items-center gap-1 rounded-md bg-[#e7fcf8] px-2 py-1 text-xs font-medium text-[#0f9e8c] shadow-sm">
      <span class="inline-block size-1.5 rounded-full bg-[#0f9e8c]" />
      {{ data.groupLabel || data.name }}
    </div>
  </section>
</template>

<style scoped>
.workflow-group {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 16px 16px;
}
</style>
