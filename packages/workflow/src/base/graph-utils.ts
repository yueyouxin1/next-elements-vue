import type { WorkflowCanvasNode, WorkflowGraphDef, WorkflowValidationIssue } from "./types"

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
  const startNodes = graph.nodes.filter(node => node.data.registryId === "Start")
  const endNodes = graph.nodes.filter(node => node.data.registryId === "End")

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

    for (const edge of graph.edges) {
      if (edge.source === current && !reachable.has(edge.target)) {
        reachable.add(edge.target)
        queue.push(edge.target)
      }
    }
  }

  const unconnectedNodes = graph.nodes.filter(node => !reachable.has(node.id) && node.type !== "workflowGroup")
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

export function findNodeById(nodes: WorkflowCanvasNode[], nodeId: string | null): WorkflowCanvasNode | null {
  if (!nodeId) {
    return null
  }

  return nodes.find(node => node.id === nodeId) ?? null
}