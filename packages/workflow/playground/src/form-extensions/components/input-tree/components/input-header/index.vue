<script setup lang="ts">
import { computed } from "vue"
import { TreeCollapseWidth } from "../../constants"
import { useColumnsStyle } from "../../hooks/use-columns-style"

const props = withDefaults(defineProps<{
  readonly?: boolean
  config: {
    hasObject?: boolean
    hasCollapse?: boolean
  }
  columnsRatio?: string
}>(), {
  readonly: false,
  columnsRatio: "4:6",
})

const columnsStyle = useColumnsStyle(
  () => props.columnsRatio,
  () => 0,
)

const headerStyle = computed(() => ({
  marginLeft: props.config.hasCollapse ? `${TreeCollapseWidth + 8}px` : "0px",
}))
</script>

<template>
  <div
    v-if="!readonly"
    class="flex items-center gap-1 px-1"
    :style="headerStyle"
  >
    <div :style="columnsStyle.name" class="min-w-0">
      <span class="text-[12px] leading-4 text-slate-400">变量名</span>
    </div>

    <div :style="columnsStyle.value" class="min-w-0">
      <span class="text-[12px] leading-4 text-slate-400">变量类型</span>
    </div>

    <div class="relative flex gap-1">
      <div v-if="config.hasObject" class="w-6" />
      <div class="w-6" />
    </div>
  </div>
</template>

