import type { WorkflowCanvasNode, WorkflowGraphDef, WorkflowRunEvent } from "./types"

type RunMockOptions = {
  delayMs?: number
  onEvent?: (event: WorkflowRunEvent) => void
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createEvent(
  event: WorkflowRunEvent["event"],
  nodeId?: string,
  payload?: Record<string, unknown>,
): WorkflowRunEvent {
  return {
    event,
    nodeId,
    payload,
    timestamp: Date.now(),
  }
}

function getExecutionOrder(graph: WorkflowGraphDef): WorkflowCanvasNode[] {
  const visibleNodes = graph.nodes.filter(node => node.type !== "workflowGroup")
  const nodeMap = new Map(visibleNodes.map(node => [node.id, node]))
  const visibleNodeIdSet = new Set(visibleNodes.map(node => node.id))
  const visibleEdges = graph.edges.filter(edge => visibleNodeIdSet.has(edge.source) && visibleNodeIdSet.has(edge.target))
  const indegree = new Map<string, number>()

  for (const node of visibleNodes) {
    indegree.set(node.id, 0)
  }

  for (const edge of visibleEdges) {
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  }

  for (const node of visibleNodes) {
    if (typeof node.data.loopScopeId !== "string") {
      continue
    }

    if (!visibleNodeIdSet.has(node.data.loopScopeId)) {
      continue
    }

    indegree.set(node.id, (indegree.get(node.id) ?? 0) + 1)
  }

  const queue = visibleNodes
    .filter(node => (indegree.get(node.id) ?? 0) === 0)
    .sort((a, b) => (a.position.x + a.position.y) - (b.position.x + b.position.y))

  const order: WorkflowCanvasNode[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    order.push(current)

    for (const edge of visibleEdges) {
      if (edge.source !== current.id) {
        continue
      }

      const nextInDegree = (indegree.get(edge.target) ?? 0) - 1
      indegree.set(edge.target, nextInDegree)
      if (nextInDegree === 0) {
        const nextNode = nodeMap.get(edge.target)
        if (nextNode) {
          queue.push(nextNode)
        }
      }
    }

    for (const scopedNode of visibleNodes) {
      if (scopedNode.data.loopScopeId !== current.id) {
        continue
      }

      const nextInDegree = (indegree.get(scopedNode.id) ?? 0) - 1
      indegree.set(scopedNode.id, nextInDegree)
      if (nextInDegree === 0) {
        queue.push(scopedNode)
      }
    }
  }

  return order
}

export async function runWorkflowMock(
  graph: WorkflowGraphDef,
  options: RunMockOptions = {},
): Promise<WorkflowRunEvent[]> {
  const events: WorkflowRunEvent[] = []
  const delayMs = options.delayMs ?? 220

  const pushEvent = (event: WorkflowRunEvent): void => {
    events.push(event)
    options.onEvent?.(event)
  }

  pushEvent(createEvent("start", undefined, { trace_id: `mock-${Date.now()}` }))

  const executionOrder = getExecutionOrder(graph)

  for (const node of executionOrder) {
    pushEvent(createEvent("node_start", node.id, { name: node.data.name }))
    await sleep(delayMs)

    if (node.data.registryId === "Branch") {
      pushEvent(createEvent("node_finish", node.id, { activated_port: "0", decision: "hit" }))
      continue
    }

    if (node.data.registryId === "LLMNode" && Math.random() > 0.96) {
      pushEvent(createEvent("node_error", node.id, { error: "mock timeout" }))
      continue
    }

    if (node.data.config.stream && node.data.config.returnType === "Text") {
      pushEvent(createEvent("stream_start", node.id, { chunk: "开始输出" }))
      await sleep(120)
      pushEvent(createEvent("stream_chunk", node.id, { chunk: "处理中..." }))
      await sleep(100)
      pushEvent(createEvent("stream_end", node.id, { chunk: "完成" }))
    }

    pushEvent(createEvent("node_finish", node.id, { output: `${node.data.name}-ok` }))
  }

  pushEvent(createEvent("finish", undefined, { output: { analysis: "mock run completed" } }))

  return events
}
