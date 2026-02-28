import type { Connection } from "@vue-flow/core"
import type {
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowNodeRunStatus,
  WorkflowRunEvent,
  WorkflowStudioMode,
} from "../../../src/base"
import { computed, ref, watch, type Ref } from "vue"
import {
  cloneGraph,
  createLoopBundle,
  createEmptyGraph,
  createNodeByRegistry,
  createWorkflowDemoGraph,
  findNodeById,
  removeNodeFromGraphWithLoopLifecycle,
  resolveLoopScope,
  runWorkflowMock,
  updateNodeById,
  validateGraph,
} from "../../../src/base"
import type { WorkflowRegistryId } from "../../../src/base"

export type UseWorkflowStudioOptions = {
  mode: Ref<WorkflowStudioMode>
}

function createWorkflowEdge(
  source: string,
  target: string,
  sourceHandle = "source",
  targetHandle = "target",
): WorkflowCanvasEdge {
  return {
    id: `${source}-${target}-${Date.now()}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: "workflowEdge",
    animated: false,
    selectable: true,
  }
}

type DeletedNodeSnapshot = Pick<WorkflowCanvasNode, "id" | "data">

function mapRunEventToStatus(event: WorkflowRunEvent): WorkflowNodeRunStatus | null {
  if (!event.nodeId) {
    return null
  }

  if (event.event === "node_start") {
    return "RUNNING"
  }

  if (event.event === "node_finish") {
    return "COMPLETED"
  }

  if (event.event === "node_error") {
    return "FAILED"
  }

  if (event.event === "node_skipped") {
    return "SKIPPED"
  }

  return null
}

function buildEditableNode(node: WorkflowCanvasNode): WorkflowCanvasNode {
  return {
    ...node,
    data: {
      ...node.data,
      config: { ...node.data.config },
      inputs: node.data.inputs.map(input => ({ ...input })),
      outputs: node.data.outputs.map(output => ({ ...output })),
    },
  }
}

export function useWorkflowStudio(options: UseWorkflowStudioOptions) {
  const selectedNodeId = ref<string | null>(null)
  const zoomPercent = ref(65)
  const running = ref(false)
  const runLogs = ref<WorkflowRunEvent[]>([])
  const dirty = ref(false)
  const lastSavedAt = ref(new Date())
  const skipDirtyTracking = ref(false)

  const initialGraph = createWorkflowDemoGraph()
  const nodes = ref<WorkflowCanvasNode[]>(initialGraph.nodes)
  const edges = ref(initialGraph.edges)

  const selectedNode = computed(() => findNodeById(nodes.value, selectedNodeId.value))

  const validationIssues = computed(() => validateGraph({
    nodes: nodes.value,
    edges: edges.value,
  }))

  const isReadOnlyMode = computed(() => options.mode.value === "readonly")

  const operationDisabled = computed(() => ["disabled", "loading", "error"].includes(options.mode.value))

  const interactionBlocked = computed(() => isReadOnlyMode.value || operationDisabled.value)

  const saveTip = computed(() => {
    if (dirty.value) {
      return "有尚未发布的修改"
    }

    return `已自动保存 ${lastSavedAt.value.toLocaleTimeString([], { hour12: false })}`
  })

  function resetStatuses(status: WorkflowNodeRunStatus = "IDLE"): void {
    nodes.value = nodes.value.map((node) => {
      if (node.type === "workflowGroup") {
        return node
      }

      return {
        ...node,
        data: {
          ...node.data,
          status,
        },
      }
    })
  }

  function markDirty(): void {
    if (!dirty.value) {
      dirty.value = true
    }
  }

  function loadByMode(mode: WorkflowStudioMode): void {
    skipDirtyTracking.value = true

    if (mode === "empty") {
      const graph = createEmptyGraph()
      nodes.value = graph.nodes
      edges.value = graph.edges
      selectedNodeId.value = null
      zoomPercent.value = 100
      dirty.value = false
      queueMicrotask(() => {
        skipDirtyTracking.value = false
      })
      return
    }

    const graph = cloneGraph(createWorkflowDemoGraph())
    nodes.value = graph.nodes
    edges.value = graph.edges
    selectedNodeId.value = null
    zoomPercent.value = Math.round((graph.viewport?.zoom ?? 1) * 100)
    dirty.value = false
    queueMicrotask(() => {
      skipDirtyTracking.value = false
    })
  }

  function saveDraft(): void {
    dirty.value = false
    lastSavedAt.value = new Date()
  }

  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId
  }

  function getRandomRootPosition(): { x: number; y: number } {
    return {
      x: 280 + Math.round(Math.random() * 240),
      y: 160 + Math.round(Math.random() * 220),
    }
  }

  function getRandomLoopChildPosition(loopBodyNode: WorkflowCanvasNode): { x: number; y: number } {
    const loopBodyStyle = typeof loopBodyNode.style === "function" ? undefined : loopBodyNode.style
    const width = Number(loopBodyStyle?.width ?? 940)
    const height = Number(loopBodyStyle?.height ?? 320)
    const safeWidth = Math.max(width - 360, 140)
    const safeHeight = Math.max(height - 170, 80)

    return {
      x: 64 + Math.round(Math.random() * safeWidth),
      y: 64 + Math.round(Math.random() * safeHeight),
    }
  }

  function addLoopNode(): void {
    const loopPosition = getRandomRootPosition()
    const bundle = createLoopBundle(
      loopPosition,
      { x: loopPosition.x - 180, y: loopPosition.y + 196 },
    )

    nodes.value = [...nodes.value, bundle.loopNode, bundle.loopBody]
    edges.value = [...edges.value, bundle.lifecycleEdge]
    selectedNodeId.value = bundle.loopNode.id
  }

  function addNodeToLoopScope(registryId: WorkflowRegistryId, scope: { loopNodeId: string; loopBodyId: string }): void {
    const loopBodyNode = findNodeById(nodes.value, scope.loopBodyId)
    if (!loopBodyNode) {
      return
    }

    const nextNode = createNodeByRegistry(registryId, getRandomLoopChildPosition(loopBodyNode))
    const scopedNode: WorkflowCanvasNode = {
      ...nextNode,
      parentNode: scope.loopBodyId,
      extent: "parent",
      data: {
        ...nextNode.data,
        loopScopeId: scope.loopNodeId,
      },
    }

    nodes.value = [...nodes.value, scopedNode]
    selectedNodeId.value = scopedNode.id
  }

  function addNode(registryId: WorkflowRegistryId): void {
    if (interactionBlocked.value) {
      return
    }

    if (registryId === "Loop") {
      addLoopNode()
      markDirty()
      return
    }

    const selectedId = selectedNodeId.value
    const loopScope = typeof selectedId === "string" ? resolveLoopScope(nodes.value, selectedId) : null

    if (loopScope && registryId !== "Start" && registryId !== "End") {
      addNodeToLoopScope(registryId, loopScope)
      markDirty()
      return
    }

    const nextNode = createNodeByRegistry(registryId, getRandomRootPosition())
    nodes.value = [...nodes.value, nextNode]
    selectedNodeId.value = nextNode.id
    markDirty()
  }

  function deleteSelectedNode(): void {
    if (interactionBlocked.value || !selectedNodeId.value) {
      return
    }

    const graph = removeNodeFromGraphWithLoopLifecycle(
      {
        nodes: nodes.value,
        edges: edges.value,
      },
      selectedNodeId.value,
    )

    nodes.value = graph.nodes
    edges.value = graph.edges
    selectedNodeId.value = null
    markDirty()
  }

  function deleteNodesWithLoopLifecycle(deletedNodes: DeletedNodeSnapshot[]): void {
    if (interactionBlocked.value || deletedNodes.length === 0) {
      return
    }

    let graph = {
      nodes: nodes.value,
      edges: edges.value,
    }

    const removedIds = new Set<string>()
    for (const deletedNode of deletedNodes) {
      removedIds.add(deletedNode.id)

      const hasLoopPartner = typeof deletedNode.data.loopPartnerId === "string"
      const isLoopNode = deletedNode.data.registryId === "Loop"
      const isLoopBody = deletedNode.data.isLoopBody === true
      if (hasLoopPartner && (isLoopNode || isLoopBody)) {
        removedIds.add(deletedNode.data.loopPartnerId as string)
      }
    }

    for (const removableId of removedIds) {
      graph = removeNodeFromGraphWithLoopLifecycle(graph, removableId)
    }

    nodes.value = graph.nodes
    edges.value = graph.edges
    if (selectedNodeId.value && !findNodeById(nodes.value, selectedNodeId.value)) {
      selectedNodeId.value = null
    }
    markDirty()
  }

  function updateSelectedNode(partial: Partial<WorkflowCanvasNode["data"]>): void {
    if (interactionBlocked.value || !selectedNodeId.value) {
      return
    }

    nodes.value = updateNodeById(nodes.value, selectedNodeId.value, (node) => {
      const draft = buildEditableNode(node)
      draft.data = {
        ...draft.data,
        ...partial,
        config: {
          ...draft.data.config,
          ...(partial.config ?? {}),
        },
      }
      return draft
    })

    markDirty()
  }

  function updateSelectedNodeConfigField(key: string, value: unknown): void {
    if (!selectedNodeId.value) {
      return
    }

    updateSelectedNode({
      config: {
        [key]: value,
      },
    })
  }

  function onConnect(connection: Connection): void {
    if (interactionBlocked.value) {
      return
    }

    const hasSource = typeof connection.source === "string"
    const hasTarget = typeof connection.target === "string"

    if (!hasSource || !hasTarget) {
      return
    }

    const nextEdge = createWorkflowEdge(
      connection.source,
      connection.target,
      connection.sourceHandle ?? "source",
      connection.targetHandle ?? "target",
    )

    edges.value = [...edges.value, nextEdge]
    markDirty()
  }

  async function runWorkflow(): Promise<void> {
    if (running.value || operationDisabled.value) {
      return
    }

    running.value = true
    runLogs.value = []
    resetStatuses("IDLE")

    const graph = cloneGraph({ nodes: nodes.value, edges: edges.value })
    await runWorkflowMock(
      graph,
      {
        delayMs: 180,
        onEvent(event) {
          runLogs.value = [event, ...runLogs.value].slice(0, 120)

          const status = mapRunEventToStatus(event)
          if (!status || !event.nodeId) {
            return
          }

          nodes.value = updateNodeById(nodes.value, event.nodeId, (node) => ({
            ...node,
            data: {
              ...node.data,
              status,
            },
          }))
        },
      },
    )

    running.value = false
  }

  watch(
    () => options.mode.value,
    (mode) => {
      loadByMode(mode)
    },
    { immediate: true },
  )

  watch(
    [nodes, edges],
    () => {
      if (selectedNodeId.value && !findNodeById(nodes.value, selectedNodeId.value)) {
        selectedNodeId.value = null
      }

      if (skipDirtyTracking.value) {
        return
      }

      if (running.value) {
        return
      }

      if (options.mode.value === "loading" || options.mode.value === "error") {
        return
      }

      markDirty()
    },
    { deep: true },
  )

  return {
    nodes,
    edges,
    selectedNodeId,
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
  }
}
