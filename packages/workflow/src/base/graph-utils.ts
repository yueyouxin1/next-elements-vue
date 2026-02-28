import type { WorkflowCanvasNode, WorkflowGraphDef, WorkflowValidationIssue } from "./types"

function isLoopNode(node: WorkflowCanvasNode): boolean {
  return node.type === "workflowNode" && node.data.registryId === "Loop"
}

function isLoopBodyNode(node: WorkflowCanvasNode): boolean {
  return node.type === "workflowGroup" && node.data.isLoopBody === true
}

function isTopLevelWorkflowNode(node: WorkflowCanvasNode): boolean {
  return node.type !== "workflowGroup" && !node.parentNode
}

export function cloneGraph(graph: WorkflowGraphDef): WorkflowGraphDef {
  return {
    nodes: graph.nodes.map(node => ({
      ...node,
      position: { ...node.position },
      data: {
        ...node.data,
        config: { ...node.data.config },
        inputs: node.data.inputs.map(input => ({ ...input })),
        outputs: node.data.outputs.map(output => ({ ...output })),
      },
    })),
    edges: graph.edges.map(edge => ({ ...edge })),
    viewport: graph.viewport ? { ...graph.viewport } : undefined,
  }
}

export function validateGraph(graph: WorkflowGraphDef): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = []
  const topLevelNodes = graph.nodes.filter(isTopLevelWorkflowNode)
  const topLevelNodeIds = new Set(topLevelNodes.map(node => node.id))
  const topLevelEdges = graph.edges.filter(edge => topLevelNodeIds.has(edge.source) && topLevelNodeIds.has(edge.target))
  const startNodes = topLevelNodes.filter(node => node.data.registryId === "Start")
  const endNodes = topLevelNodes.filter(node => node.data.registryId === "End")

  if (startNodes.length === 0) {
    issues.push({ code: "NO_START", message: "缺少 Start 节点" })
  }

  if (endNodes.length === 0) {
    issues.push({ code: "NO_END", message: "缺少 End 节点" })
  }

  if (startNodes.length > 1) {
    issues.push({ code: "MULTIPLE_START", message: "Start 节点只能有一个" })
  }

  if (endNodes.length > 1) {
    issues.push({ code: "MULTIPLE_END", message: "End 节点只能有一个" })
  }

  const startId = startNodes[0]?.id
  if (!startId) {
    return issues
  }

  const reachable = new Set<string>([startId])
  const queue = [startId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    for (const edge of topLevelEdges) {
      if (edge.source === current && !reachable.has(edge.target)) {
        reachable.add(edge.target)
        queue.push(edge.target)
      }
    }
  }

  const unconnectedNodes = topLevelNodes.filter(node => !reachable.has(node.id))
  if (unconnectedNodes.length > 0) {
    issues.push({
      code: "UNCONNECTED",
      message: `存在 ${unconnectedNodes.length} 个从 Start 不可达的节点`,
    })
  }

  return issues
}

export function updateNodeById(
  nodes: WorkflowCanvasNode[],
  nodeId: string,
  updater: (node: WorkflowCanvasNode) => WorkflowCanvasNode,
): WorkflowCanvasNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) {
      return node
    }

    return updater(node)
  })
}

export function removeNodeFromGraph(graph: WorkflowGraphDef, nodeId: string): WorkflowGraphDef {
  return {
    ...graph,
    nodes: graph.nodes.filter(node => node.id !== nodeId && node.parentNode !== nodeId),
    edges: graph.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
  }
}

export function resolveLoopScope(
  nodes: WorkflowCanvasNode[],
  nodeId: string,
): { loopNodeId: string; loopBodyId: string } | null {
  const targetNode = nodes.find(node => node.id === nodeId)
  if (!targetNode) {
    return null
  }

  if (isLoopNode(targetNode) && typeof targetNode.data.loopPartnerId === "string") {
    return {
      loopNodeId: targetNode.id,
      loopBodyId: targetNode.data.loopPartnerId,
    }
  }

  if (isLoopBodyNode(targetNode) && typeof targetNode.data.loopPartnerId === "string") {
    return {
      loopNodeId: targetNode.data.loopPartnerId,
      loopBodyId: targetNode.id,
    }
  }

  const parentNodeId = targetNode.parentNode
  if (typeof parentNodeId === "string") {
    const parentNode = nodes.find(node => node.id === parentNodeId)
    if (parentNode && isLoopBodyNode(parentNode) && typeof parentNode.data.loopPartnerId === "string") {
      return {
        loopNodeId: parentNode.data.loopPartnerId,
        loopBodyId: parentNode.id,
      }
    }
  }

  if (typeof targetNode.data.loopScopeId !== "string") {
    return null
  }

  const loopNode = nodes.find(node => node.id === targetNode.data.loopScopeId && isLoopNode(node))
  if (!loopNode || typeof loopNode.data.loopPartnerId !== "string") {
    return null
  }

  return {
    loopNodeId: loopNode.id,
    loopBodyId: loopNode.data.loopPartnerId,
  }
}

export function removeNodeFromGraphWithLoopLifecycle(graph: WorkflowGraphDef, nodeId: string): WorkflowGraphDef {
  const targetNode = graph.nodes.find(node => node.id === nodeId)
  if (!targetNode) {
    return graph
  }

  const removableNodeIds = new Set<string>([nodeId])
  const shouldRemoveLoopPair = isLoopNode(targetNode) || isLoopBodyNode(targetNode)

  if (shouldRemoveLoopPair) {
    const scope = resolveLoopScope(graph.nodes, nodeId)
    if (scope) {
      removableNodeIds.add(scope.loopNodeId)
      removableNodeIds.add(scope.loopBodyId)
    }
  }

  let shouldSearchChildren = true
  while (shouldSearchChildren) {
    shouldSearchChildren = false

    for (const node of graph.nodes) {
      if (typeof node.parentNode !== "string") {
        continue
      }

      if (!removableNodeIds.has(node.parentNode) || removableNodeIds.has(node.id)) {
        continue
      }

      removableNodeIds.add(node.id)
      shouldSearchChildren = true
    }
  }

  return {
    ...graph,
    nodes: graph.nodes.filter(node => !removableNodeIds.has(node.id)),
    edges: graph.edges.filter(edge => !removableNodeIds.has(edge.source) && !removableNodeIds.has(edge.target)),
  }
}

export function findNodeById(nodes: WorkflowCanvasNode[], nodeId: string | null): WorkflowCanvasNode | null {
  if (!nodeId) {
    return null
  }

  return nodes.find(node => node.id === nodeId) ?? null
}
