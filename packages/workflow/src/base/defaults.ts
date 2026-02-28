import type { WorkflowCanvasEdge, WorkflowCanvasNode, WorkflowGraphDef, WorkflowRegistryId } from "./types"
import { getDefaultNodeData } from "../nodes/registry"

function createNode(
  id: string,
  registryId: WorkflowRegistryId,
  x: number,
  y: number,
  options?: Partial<WorkflowCanvasNode>,
): WorkflowCanvasNode {
  const defaultData = getDefaultNodeData(registryId)

  return {
    id,
    type: "workflowNode",
    position: { x, y },
    data: {
      ...defaultData,
      status: "IDLE",
      ...(options?.data ?? {}),
    },
    draggable: true,
    selectable: true,
    ...options,
  }
}

function createEdge(source: string, target: string, sourceHandle = "source", targetHandle = "target"): WorkflowCanvasEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: "workflowEdge",
    animated: false,
    selectable: true,
  }
}

export type CreateLoopBundleOptions = {
  loopNodeId?: string
  loopBodyId?: string
  loopBodySize?: {
    width: number
    height: number
  }
}

export type WorkflowLoopBundle = {
  loopNode: WorkflowCanvasNode
  loopBody: WorkflowCanvasNode
  lifecycleEdge: WorkflowCanvasEdge
}

export function createLoopBundle(
  loopNodePosition: { x: number; y: number },
  loopBodyPosition: { x: number; y: number },
  options: CreateLoopBundleOptions = {},
): WorkflowLoopBundle {
  const loopNodeId = options.loopNodeId ?? createNodeId("Loop")
  const loopBodyId = options.loopBodyId ?? `${loopNodeId}_body`
  const loopBodySize = options.loopBodySize ?? { width: 940, height: 320 }

  const loopNode = createNode(loopNodeId, "Loop", loopNodePosition.x, loopNodePosition.y, {
    data: {
      ...getDefaultNodeData("Loop"),
      name: "循环",
      status: "IDLE",
      loopPartnerId: loopBodyId,
      loopScopeId: loopNodeId,
    },
  })

  const loopBody: WorkflowCanvasNode = {
    id: loopBodyId,
    type: "workflowGroup",
    position: {
      x: loopBodyPosition.x,
      y: loopBodyPosition.y,
    },
    style: {
      width: loopBodySize.width,
      height: loopBodySize.height,
    },
    data: {
      ...getDefaultNodeData("Loop"),
      name: "循环体",
      status: "IDLE",
      groupLabel: "循环体",
      isLoopBody: true,
      loopPartnerId: loopNodeId,
      loopScopeId: loopNodeId,
    },
    draggable: true,
    selectable: true,
    zIndex: -1,
  }

  const lifecycleEdge = createEdge(loopNodeId, loopBodyId, "loop-body-source", "loop-body-target")

  return {
    loopNode,
    loopBody,
    lifecycleEdge,
  }
}

export function createWorkflowDemoGraph(): WorkflowGraphDef {
  const loopBundle = createLoopBundle(
    { x: 708, y: 170 },
    { x: 528, y: 366 },
    {
      loopNodeId: "loop",
      loopBodyId: "loop_body",
      loopBodySize: { width: 980, height: 360 },
    },
  )

  const nodes: WorkflowCanvasNode[] = [
    createNode("start", "Start", 102, 170),
    createNode("tool_search", "ToolNode", 408, 170, {
      data: {
        ...getDefaultNodeData("ToolNode"),
        name: "search",
        subtitle: "int.count   int.cursor   str.input_query",
      },
    }),
    loopBundle.loopNode,
    createNode("llm", "LLMNode", 1014, 170, {
      data: {
        ...getDefaultNodeData("LLMNode"),
        name: "llm",
        subtitle: "str.name   str.search_result",
      },
    }),
    createNode("end", "End", 1318, 170),
    loopBundle.loopBody,
    createNode("loop_model", "LLMNode", 676, 468, {
      parentNode: "loop_body",
      extent: "parent",
      position: { x: 108, y: 98 },
      data: {
        ...getDefaultNodeData("LLMNode"),
        name: "大模型",
        subtitle: "str.input",
        loopScopeId: "loop",
      },
    }),
    createNode("loop_image", "ToolNode", 1000, 468, {
      parentNode: "loop_body",
      extent: "parent",
      position: { x: 488, y: 98 },
      data: {
        ...getDefaultNodeData("ToolNode"),
        name: "图像生成",
        subtitle: "str.data   str.msg",
        loopScopeId: "loop",
      },
    }),
  ]

  const edges: WorkflowCanvasEdge[] = [
    createEdge("start", "tool_search"),
    createEdge("tool_search", "loop"),
    createEdge("loop", "llm"),
    createEdge("llm", "end"),
    loopBundle.lifecycleEdge,
    createEdge("loop_body", "loop_model", "source", "target"),
    createEdge("loop_model", "loop_image"),
    createEdge("loop_image", "loop_body", "source", "target"),
  ]

  return {
    nodes,
    edges,
    viewport: { x: -44, y: -26, zoom: 0.7 },
  }
}

export function createEmptyGraph(): WorkflowGraphDef {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

export function createNodeId(registryId: WorkflowRegistryId): string {
  return `${registryId.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createNodeByRegistry(
  registryId: WorkflowRegistryId,
  position: { x: number; y: number },
): WorkflowCanvasNode {
  return createNode(createNodeId(registryId), registryId, position.x, position.y)
}
