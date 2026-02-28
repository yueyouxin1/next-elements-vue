<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import type { WorkflowCanvasNodeData } from "../base/types"
import { Handle, Position } from "@vue-flow/core"

defineProps<NodeProps<WorkflowCanvasNodeData>>()
</script>

<template>
  <section class="workflow-group h-full w-full rounded-[12px] border border-[#d8e7ea] bg-[#eef8f9] p-5">
    <Handle
      id="loop-body-target"
      type="target"
      :position="Position.Top"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />
    <Handle
      id="source"
      type="source"
      :position="Position.Left"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />
    <Handle
      id="target"
      type="target"
      :position="Position.Right"
      class="!h-3.5 !w-3.5 !border-[1.5px] !border-white !bg-[#5d63ff] !shadow-[0_0_0_1px_rgba(93,99,255,0.28)]"
    />

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
  backdrop-filter: blur(1px);
}
</style>
