<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@repo/ui-shadcn/components/ui/drawer"
import DatabaseIdeControlPanel from "./DatabaseIdeControlPanel.vue"
import DatabaseIdeLayout from "./DatabaseIdeLayout.vue"
import DatabaseIdeQueryEditor from "./DatabaseIdeQueryEditor.vue"
import DatabaseIdeResultGrid from "./DatabaseIdeResultGrid.vue"
import DatabaseIdeSchemaTree from "./DatabaseIdeSchemaTree.vue"
import DatabaseIdeToolbar from "./DatabaseIdeToolbar.vue"
import {
  defaultQueryResultMock,
  defaultSelectedTableId,
  edgeQueryResultMock,
  emptyQueryErrorMock,
  emptyQueryResultMock,
  queryExamplesMock,
  scenarioDescriptors,
  schemaTreeMock,
  syntaxErrorMock,
  type DemoScenario,
  type QueryErrorMock,
  type QueryResultSet,
  type SchemaTreeNode,
} from "./mock"

type RunState = "idle" | "active" | "loading" | "success" | "error"

const runState = ref<RunState>("idle")
const scenario = ref<DemoScenario>("default")
const sql = ref(queryExamplesMock[0]?.sql ?? "")
const activeExampleId = ref(queryExamplesMock[0]?.id ?? "")
const selectedTableId = ref(defaultSelectedTableId)
const expandedIds = ref<string[]>(["db-analytics", "schema-public", "schema-warehouse"])
const currentResult = ref<QueryResultSet>(defaultQueryResultMock)
const currentError = ref<QueryErrorMock | null>(null)
const isSidebarCollapsed = ref(false)
const isMobileSchemaOpen = ref(false)
const runPressed = ref(false)
const viewportWidth = ref(typeof window === "undefined" ? 1280 : window.innerWidth)

let pressTimer: ReturnType<typeof setTimeout> | null = null
let loadingTimer: ReturnType<typeof setTimeout> | null = null
let runSequence = 0

const isMobile = computed(() => viewportWidth.value < 768)
const isTablet = computed(() => viewportWidth.value >= 768 && viewportWidth.value <= 1024)

const selectedTableLabel = computed(() => {
  const tableNode = findNodeById(schemaTreeMock, selectedTableId.value)
  return tableNode?.label ?? "unknown"
})

const filteredExamples = computed(() =>
  queryExamplesMock.filter(item => item.tableId === selectedTableId.value),
)

function updateViewportState() {
  viewportWidth.value = window.innerWidth
  if (!isTablet.value) {
    isSidebarCollapsed.value = false
  }
}

function toggleNode(nodeId: string) {
  if (!expandedIds.value.includes(nodeId)) {
    expandedIds.value = [...expandedIds.value, nodeId]
    return
  }
  expandedIds.value = expandedIds.value.filter(id => id !== nodeId)
}

function selectNode(nodeId: string) {
  const node = findNodeById(schemaTreeMock, nodeId)
  if (!node) return
  if (node.type !== "table") {
    if (node.children?.length) {
      toggleNode(nodeId)
    }
    return
  }

  selectedTableId.value = nodeId
  const matchedExample = queryExamplesMock.find(item => item.tableId === nodeId)
  if (matchedExample) {
    activeExampleId.value = matchedExample.id
    sql.value = matchedExample.sql
  }
}

function pickExample(exampleId: string) {
  const example = queryExamplesMock.find(item => item.id === exampleId)
  if (!example) return
  activeExampleId.value = example.id
  selectedTableId.value = example.tableId
  sql.value = example.sql
}

function clearTimers() {
  if (pressTimer) clearTimeout(pressTimer)
  if (loadingTimer) clearTimeout(loadingTimer)
  pressTimer = null
  loadingTimer = null
}

function resolveResult(nextScenario: DemoScenario, sqlText: string): {
  state: RunState
  result: QueryResultSet
  error: QueryErrorMock | null
} {
  const normalized = sqlText.trim().toLowerCase()

  if (!normalized) {
    return {
      state: "error",
      result: emptyQueryResultMock,
      error: emptyQueryErrorMock,
    }
  }

  if (nextScenario === "error" || normalized.includes("???") || normalized.includes("drop table")) {
    return {
      state: "error",
      result: defaultQueryResultMock,
      error: syntaxErrorMock,
    }
  }

  if (nextScenario === "empty" || normalized.includes("where 1 = 0")) {
    return {
      state: "success",
      result: emptyQueryResultMock,
      error: null,
    }
  }

  if (nextScenario === "edge") {
    return {
      state: "success",
      result: edgeQueryResultMock,
      error: null,
    }
  }

  return {
    state: "success",
    result: defaultQueryResultMock,
    error: null,
  }
}

function runQuery() {
  clearTimers()
  runSequence += 1
  const currentSeq = runSequence

  runPressed.value = true
  runState.value = "active"

  pressTimer = setTimeout(() => {
    runPressed.value = false
    if (currentSeq !== runSequence) return
    runState.value = "loading"
  }, 100)

  loadingTimer = setTimeout(() => {
    if (currentSeq !== runSequence) return
    const output = resolveResult(scenario.value, sql.value)
    runState.value = output.state
    currentResult.value = output.result
    currentError.value = output.error
  }, 900)
}

function resetDemo() {
  scenario.value = "default"
  selectedTableId.value = defaultSelectedTableId
  activeExampleId.value = queryExamplesMock[0]?.id ?? ""
  sql.value = queryExamplesMock[0]?.sql ?? ""
  runState.value = "idle"
  currentResult.value = defaultQueryResultMock
  currentError.value = null
  clearTimers()
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault()
    runQuery()
  }
}

onMounted(() => {
  updateViewportState()
  window.addEventListener("resize", updateViewportState)
  window.addEventListener("keydown", handleKeydown)

  const params = new URLSearchParams(window.location.search)
  const urlScenario = params.get("scenario")
  if (urlScenario === "default" || urlScenario === "empty" || urlScenario === "error" || urlScenario === "edge") {
    scenario.value = urlScenario
  }
})

onBeforeUnmount(() => {
  clearTimers()
  window.removeEventListener("resize", updateViewportState)
  window.removeEventListener("keydown", handleKeydown)
})

function findNodeById(nodes: SchemaTreeNode[], id: string): SchemaTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}
</script>

<template>
  <div class="space-y-3">
    <DatabaseIdeControlPanel
      v-model="scenario"
      :descriptors="scenarioDescriptors"
      @reset="resetDemo"
    />

    <section class="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      主流程: 选择表 -> 编辑 SQL -> 点击 Run 或按 Ctrl/Cmd + Enter -> 查看结果/错误。
    </section>

    <section class="overflow-hidden rounded-lg border border-border">
      <DatabaseIdeToolbar
        :run-state="runState"
        :selected-table-label="selectedTableLabel"
        :run-pressed="runPressed"
        :is-mobile="isMobile"
        :is-tablet="isTablet"
        :is-sidebar-collapsed="isSidebarCollapsed"
        @run="runQuery"
        @toggle-sidebar="toggleSidebar"
        @open-mobile-schema="isMobileSchemaOpen = true"
      />

      <DatabaseIdeLayout
        :is-mobile="isMobile"
        :is-tablet="isTablet"
        :is-sidebar-collapsed="isSidebarCollapsed"
      >
        <template #schema>
          <DatabaseIdeSchemaTree
            :nodes="schemaTreeMock"
            :selected-id="selectedTableId"
            :expanded-ids="expandedIds"
            :icon-only="isTablet && isSidebarCollapsed"
            @select="selectNode"
            @toggle="toggleNode"
          />
        </template>

        <template #editor>
          <DatabaseIdeQueryEditor
            v-model="sql"
            :examples="filteredExamples.length ? filteredExamples : queryExamplesMock"
            :active-example-id="activeExampleId"
            :run-state="runState"
            @run="runQuery"
            @pick-example="pickExample"
          />
        </template>

        <template #result>
          <DatabaseIdeResultGrid
            :run-state="runState"
            :result="currentResult"
            :error="currentError"
          />
        </template>
      </DatabaseIdeLayout>
    </section>

    <Drawer v-model:open="isMobileSchemaOpen" :modal="false">
      <DrawerContent direction="bottom" class="h-[75vh]">
        <DrawerHeader class="border-b border-border">
          <DrawerTitle>Schema Browser</DrawerTitle>
        </DrawerHeader>
        <div class="min-h-0 flex-1 overflow-hidden">
          <DatabaseIdeSchemaTree
            :nodes="schemaTreeMock"
            :selected-id="selectedTableId"
            :expanded-ids="expandedIds"
            @select="(id) => { selectNode(id); isMobileSchemaOpen = false }"
            @toggle="toggleNode"
          />
        </div>
      </DrawerContent>
    </Drawer>
  </div>
</template>
