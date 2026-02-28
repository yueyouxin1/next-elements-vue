<script setup lang="ts">
import type { WorkflowCanvasNode, WorkflowRegistryId, WorkflowStudioMode } from "../../../src/base"
import type { ParameterSchema } from "../../../src/base"
import { computed, ref, toRef } from "vue"
import { Background } from "@vue-flow/background"
import { VueFlow } from "@vue-flow/core"
import {
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  MoreHorizontal,
  Play,
  Plus,
  Save,
  Scan,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-vue-next"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui-shadcn/components/ui/dropdown-menu"
import { workflowEdgeTypes, workflowNodeTypes } from "../../../src/render"
import { workflowNodeRegistry } from "../../../src/nodes"
import WorkflowNodePanel from "../panels/WorkflowNodePanel.vue"
import WorkflowTestRunPanel from "../test-run/WorkflowTestRunPanel.vue"
import { useWorkflowStudio } from "./use-workflow-studio"
import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"

const props = withDefaults(defineProps<{ mode?: WorkflowStudioMode }>(), {
  mode: "default",
})
const currentMode = toRef(props, "mode")

const {
  nodes,
  edges,
  selectedNode,
  runLogs,
  running,
  zoomPercent,
  isReadOnlyMode,
  operationDisabled,
  interactionBlocked,
  validationIssues,
  saveTip,
  addNode,
  onConnect,
  selectNode,
  saveDraft,
  runWorkflow,
  deleteSelectedNode,
  deleteNodesWithLoopLifecycle,
  updateSelectedNode,
  updateSelectedNodeConfigField,
} = useWorkflowStudio({ mode: currentMode })

const flowApi = ref<{
  zoomIn?: (options?: unknown) => void | Promise<boolean>
  zoomOut?: (options?: unknown) => void | Promise<boolean>
  fitView?: (options?: unknown) => void | Promise<boolean>
  viewport?: { value?: { zoom?: number } }
} | null>(null)

const modeText = computed(() => {
  if (props.mode === "readonly")
    return "只读"
  if (props.mode === "disabled")
    return "禁用"
  if (props.mode === "loading")
    return "加载中"
  if (props.mode === "error")
    return "错误"
  if (props.mode === "empty")
    return "空态"
  return "编辑中"
})

const currentZoomText = computed(() => `${zoomPercent.value}%`)
const runPanelVisible = computed(() => running.value || runLogs.value.length > 0)

function onFlowInit(api: unknown): void {
  flowApi.value = api as typeof flowApi.value
  refreshZoomPercent()
}

function refreshZoomPercent(): void {
  const zoom = flowApi.value?.viewport?.value?.zoom
  if (typeof zoom === "number") {
    zoomPercent.value = Math.round(zoom * 100)
  }
}

async function zoomInCanvas(): Promise<void> {
  await flowApi.value?.zoomIn?.({ duration: 120 })
  refreshZoomPercent()
}

async function zoomOutCanvas(): Promise<void> {
  await flowApi.value?.zoomOut?.({ duration: 120 })
  refreshZoomPercent()
}

async function fitCanvas(): Promise<void> {
  await flowApi.value?.fitView?.({ padding: 0.18, duration: 180 })
  refreshZoomPercent()
}

function publishWorkflow(): void {
  saveDraft()
}

function onNodeClick(event: { node: { id: string } }): void {
  selectNode(event.node.id)
}

function onPaneClick(): void {
  selectNode(null)
}

function onNodesDelete(deletedNodes: Array<Pick<WorkflowCanvasNode, "id" | "data">>): void {
  deleteNodesWithLoopLifecycle(deletedNodes)
}

function handleAddNode(registryId: string): void {
  addNode(registryId as WorkflowRegistryId)
}

function handleSchemaUpdate(payload: {
  field: "inputs" | "outputs"
  schemas: ParameterSchema[]
}): void {
  if (payload.field === "inputs") {
    updateSelectedNode({ inputs: payload.schemas })
    return
  }

  updateSelectedNode({ outputs: payload.schemas })
}
</script>

<template>
  <section class="workflow-studio flex h-[780px] flex-col overflow-hidden rounded-[18px] border border-[#d8deeb] bg-[#f4f6fb] shadow-[0_6px_22px_rgba(15,23,42,0.08)]">
    <header class="flex items-center justify-between border-b border-[#dde2ec] bg-[#f1f2f7] px-4 py-3">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" class="text-slate-500">
          <ChevronLeft class="size-4" />
        </Button>
        <div class="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
          <Scan class="size-5" />
        </div>
        <div>
          <p class="text-base font-semibold text-slate-900">
            hotspot_analysis_1_553
          </p>
          <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1">
              <Clock3 class="size-3" />
              {{ saveTip }}
            </span>
            <span>·</span>
            <span>{{ validationIssues.length === 0 ? "结构校验通过" : "存在结构风险" }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" class="text-slate-500">
          <Copy class="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" class="text-slate-500">
          <Clock3 class="size-4" />
        </Button>
        <Badge variant="secondary" class="bg-[#e9ecf8] text-[#5560c9]">
          {{ modeText }}
        </Badge>
        <Button
          size="sm"
          class="rounded-[10px] bg-[#4e56f0] px-5 text-white hover:bg-[#454de4]"
          :disabled="operationDisabled"
          @click="publishWorkflow"
        >
          发布
        </Button>
        <Button variant="ghost" size="icon-sm" :disabled="operationDisabled" class="text-slate-500">
          <MoreHorizontal class="size-4" />
        </Button>
      </div>
    </header>

    <div class="min-h-0 flex-1">
      <div class="relative h-full min-w-0">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="workflowNodeTypes"
          :edge-types="workflowEdgeTypes"
          :nodes-draggable="!interactionBlocked"
          :nodes-connectable="!interactionBlocked"
          :elements-selectable="!operationDisabled"
          :min-zoom="0.35"
          :max-zoom="1.8"
          :fit-view-on-init="true"
          :select-nodes-on-drag="true"
          :pan-on-scroll="true"
          :pan-on-drag="[0, 1]"
          :zoom-on-scroll="true"
          :zoom-on-pinch="true"
          :zoom-on-double-click="false"
          class="workflow-flow bg-[#f5f6fb]"
          @init="onFlowInit"
          @connect="onConnect"
          @node-click="onNodeClick"
          @nodes-delete="onNodesDelete"
          @pane-click="onPaneClick"
          @move-end="refreshZoomPercent"
        >
          <Background :gap="24" :size="1" pattern-color="rgba(148,163,184,0.28)" />
        </VueFlow>

        <div v-if="runPanelVisible" class="absolute bottom-[82px] left-5 h-[170px] w-[360px]">
          <WorkflowTestRunPanel :running="running" :events="runLogs" :issues="validationIssues" />
        </div>

        <div class="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div class="inline-flex items-center gap-1 rounded-[14px] border border-[#d9dfec] bg-white px-2 py-1 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
            <Button variant="ghost" size="icon-sm" class="text-slate-500" @click="zoomOutCanvas">
              <ZoomOut class="size-4" />
            </Button>
            <div class="inline-flex h-8 min-w-[66px] items-center justify-center rounded-md border border-slate-200 px-2 text-xs text-slate-600">
              {{ currentZoomText }}
            </div>
            <Button variant="ghost" size="icon-sm" class="text-slate-500" @click="zoomInCanvas">
              <ZoomIn class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="text-slate-500" @click="fitCanvas">
              <Check class="size-4" />
            </Button>

            <div class="mx-1 h-5 w-px bg-slate-200" />

            <Button variant="ghost" size="icon-sm" class="text-slate-500">
              <Search class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="text-slate-500" :disabled="operationDisabled" @click="saveDraft">
              <Save class="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button size="sm" variant="ghost" :disabled="interactionBlocked" class="text-[#4e56f0]">
                  <Plus class="size-4" />
                  添加节点
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" class="w-44">
                <DropdownMenuItem
                  v-for="[registryId, meta] in Object.entries(workflowNodeRegistry)"
                  :key="registryId"
                  @click="handleAddNode(registryId)"
                >
                  {{ meta.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              class="rounded-[10px] bg-emerald-500 px-6 text-white hover:bg-emerald-600"
              :disabled="operationDisabled"
              @click="runWorkflow"
            >
              <Play class="size-4" />
              {{ running ? "运行中" : "试运行" }}
            </Button>
          </div>
        </div>

        <div
          v-if="currentMode === 'loading'"
          class="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/85"
        >
          <div class="rounded-xl border bg-white px-6 py-5 text-sm text-slate-600 shadow">
            工作流加载中...
          </div>
        </div>

        <div
          v-if="currentMode === 'error'"
          class="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/85"
        >
          <div class="space-y-3 rounded-xl border bg-white px-6 py-5 text-center shadow">
            <p class="text-sm font-medium text-red-600">
              图结构加载失败
            </p>
            <p class="text-xs text-slate-500">
              请检查 mock 契约与节点定义。
            </p>
          </div>
        </div>

        <div
          v-if="currentMode === 'empty'"
          class="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80"
        >
          <div class="space-y-3 rounded-xl border border-dashed bg-white px-8 py-6 text-center">
            <p class="text-sm font-medium text-slate-700">
              当前暂无节点
            </p>
            <Button size="sm" @click="addNode('Start')">
              <Plus class="size-4" />
              创建 Start 节点
            </Button>
          </div>
        </div>

        <div
          v-if="selectedNode"
          class="absolute inset-y-0 right-0 z-30 w-[388px] border-l border-[#dde2ec] bg-white shadow-[-8px_0_24px_rgba(15,23,42,0.08)]"
        >
          <WorkflowNodePanel
            :node="selectedNode"
            :readonly="isReadOnlyMode"
            :disabled="operationDisabled"
            @update-name="(value) => updateSelectedNode({ name: value })"
            @update-description="(value) => updateSelectedNode({ description: value })"
            @update-config="(payload) => updateSelectedNodeConfigField(payload.key, payload.value)"
            @update-schemas="handleSchemaUpdate"
            @close="selectNode(null)"
            @delete="deleteSelectedNode"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.workflow-flow {
  height: 100%;
  width: 100%;
}

.workflow-studio :deep(.vue-flow__controls) {
  display: none;
}

.workflow-studio :deep(.vue-flow__pane) {
  cursor: grab;
}

.workflow-studio :deep(.vue-flow__pane.dragging) {
  cursor: grabbing;
}

.workflow-studio :deep(.vue-flow__edge-path) {
  stroke-linecap: round;
}
</style>
