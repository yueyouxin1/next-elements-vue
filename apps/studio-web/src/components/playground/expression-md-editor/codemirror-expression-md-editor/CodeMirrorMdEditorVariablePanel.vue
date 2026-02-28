<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type {
  CodeMirrorExpressionPopupContext,
  CodeMirrorExpressionPopupSelectPayload,
} from "@repo/editor"

const props = defineProps<{
  context?: CodeMirrorExpressionPopupContext
}>()

const emit = defineEmits<{
  (e: "select", payload: CodeMirrorExpressionPopupSelectPayload): void
  (e: "close"): void
}>()

const activeIndex = ref(0)

const variables = [
  { label: "user.name", value: "user.name" },
  { label: "user.email", value: "user.email" },
  { label: "workflow.id", value: "workflow.id" },
  { label: "runtime.locale", value: "runtime.locale" },
]

const filteredVariables = computed(() => {
  const query = (props.context?.queryText ?? "").toLowerCase()
  if (!query) {
    return variables
  }
  return variables.filter(item => item.label.toLowerCase().includes(query))
})

watch(filteredVariables, (items) => {
  if (!items.length) {
    activeIndex.value = 0
    return
  }
  if (activeIndex.value >= items.length) {
    activeIndex.value = 0
  }
})

function selectVariable(variable: string): void {
  const trigger = props.context?.triggerText ?? "{{"
  const closeToken = trigger === "${" ? "}" : "}}"
  emit("select", {
    insertText: `${trigger}${variable}${closeToken}`,
    replaceRange: props.context?.defaultReplaceRange,
  })
}

function handleKeydown(event: KeyboardEvent): void {
  event.stopPropagation()

  if (!filteredVariables.value.length) {
    if (event.key === "Escape") {
      emit("close")
    }
    return
  }

  if (event.key === "ArrowDown") {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filteredVariables.value.length
    return
  }

  if (event.key === "ArrowUp") {
    event.preventDefault()
    activeIndex.value =
      activeIndex.value === 0 ? filteredVariables.value.length - 1 : activeIndex.value - 1
    return
  }

  if (event.key === "Enter") {
    event.preventDefault()
    const target = filteredVariables.value[activeIndex.value]
    if (target) {
      selectVariable(target.value)
    }
    return
  }

  if (event.key === "Escape") {
    event.preventDefault()
    emit("close")
  }
}
</script>

<template>
  <div
    class="popup-panel rounded-lg border bg-background p-2 shadow-xl"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <div class="mb-2 flex items-center justify-between px-1">
      <p class="text-xs font-medium text-muted-foreground">
        表达式变量
      </p>
      <button
        type="button"
        class="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
        @click.stop="emit('close')"
      >
        Esc
      </button>
    </div>

    <div v-if="filteredVariables.length === 0" class="px-2 py-4 text-xs text-muted-foreground">
      没有匹配项
    </div>
    <ul v-else class="space-y-1">
      <li v-for="(item, index) in filteredVariables" :key="item.value">
        <button
          type="button"
          class="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
          :class="{ 'bg-muted': index === activeIndex }"
          @mouseenter="activeIndex = index"
          @click.stop="selectVariable(item.value)"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.popup-panel {
  min-width: 240px;
}
</style>
