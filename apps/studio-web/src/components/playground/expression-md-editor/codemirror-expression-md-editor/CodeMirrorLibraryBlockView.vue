<script setup lang="ts">
import { computed } from "vue"
import { Box, FileText } from "lucide-vue-next"
import type { CodeMirrorMdExpressionContext } from "@repo/editor"

const props = withDefaults(defineProps<{
  title?: string
  type?: string
  context?: CodeMirrorMdExpressionContext
}>(), {
  title: "",
  type: "plugin",
  context: undefined,
})

const iconComponent = computed(() => (props.type === "text" ? FileText : Box))

const resolvedTitle = computed(() => {
  if (props.title) {
    return props.title
  }
  return props.context?.content ?? ""
})
</script>

<template>
  <span class="library-block-chip">
    <component :is="iconComponent" class="library-block-icon" />
    <span class="library-block-title">{{ resolvedTitle }}</span>
  </span>
</template>

<style scoped>
.library-block-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.12);
  padding: 1px 8px;
  vertical-align: baseline;
}

.library-block-icon {
  width: 14px;
  height: 14px;
  color: rgb(79, 70, 229);
  flex-shrink: 0;
}

.library-block-title {
  font-size: 1em;
  line-height: 1.4;
  color: rgb(55, 48, 163);
  white-space: nowrap;
}
</style>
