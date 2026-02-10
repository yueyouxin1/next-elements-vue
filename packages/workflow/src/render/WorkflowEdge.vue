<script setup lang="ts">
import type { EdgeProps } from "@vue-flow/core"
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@vue-flow/core"
import { computed } from "vue"

const props = defineProps<EdgeProps>()

const pathMeta = computed(() => {
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })

  return { path, labelX, labelY }
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="pathMeta.path"
    :style="{
      stroke: selected ? '#4e5dff' : '#5f68e5',
      strokeWidth: selected ? 2.2 : 2,
      opacity: selected ? 1 : 0.9,
    }"
  />
  <circle
    v-if="animated"
    fill="#4f5ef7"
    r="3"
  >
    <animateMotion :path="pathMeta.path" dur="1.5s" repeatCount="indefinite" />
  </circle>
  <EdgeLabelRenderer>
    <div
      :style="{
        transform: `translate(-50%, -50%) translate(${pathMeta.labelX}px,${pathMeta.labelY}px)`,
      }"
      class="pointer-events-none absolute rounded bg-white/90 px-1 py-0.5 text-[10px] text-[#7e85d9] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
    >
      {{ source }}→{{ target }}
    </div>
  </EdgeLabelRenderer>
</template>
