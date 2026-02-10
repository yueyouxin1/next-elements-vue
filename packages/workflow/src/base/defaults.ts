import type { WorkflowCanvasEdge, WorkflowCanvasNode, WorkflowGraphDef, WorkflowRegistryId } from "./types"
import { getDefaultNodeData } from "../nodes/registry"

function createNode(
  id: string,
  registryId: WorkflowRegistryId,
  x: number,
  y: number,
  options?: Partial<WorkflowCanvasNode>,
): WorkflowCanvasNode {
  return {
    id,
    type: "workflowNode",
    position: { x, y },
    data: {
      ...getDefaultNodeData(registryId),
      status: "IDLE",
      subtitle: options?.data?.subtitle as string | undefined,
      muted: options?.data?.muted as boolean | undefined,
      groupLabel: options?.data?.groupLabel as string | undefined,
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

export function createWorkflowDemoGraph(): WorkflowGraphDef {
  const loopGroup: WorkflowCanvasNode = {
    id: "loop_group",
    type: "workflowGroup",
    position: { x: 40, y: 336 },
    style: {
      width: 1260,
      height: 430,
    },
    data: {
      ...getDefaultNodeData("Loop"),
      status: "IDLE",
      groupLabel: "循环体",
    },
    draggable: true,
    selectable: true,
    zIndex: -1,
  }

  const nodes: WorkflowCanvasNode[] = [
    createNode("start", "Start", 178, 192),
    createNode("tool_search", "ToolNode", 716, 48),
    createNode("selector", "Branch", 716, 198),
    createNode("output_collect", "Output", 1138, 68),
    createNode("search_result", "Output", 1138, 208, {
      data: {
        ...getDefaultNodeData("Output"),
        name: "搜索结果",
        subtitle: "支持中间过程的动态输出",
      },
    }),
    createNode("news_merge", "AgentNode", 1138, 348),
    createNode("exception_handle", "Output", 1138, 488, {
      data: {
        ...getDefaultNodeData("Output"),
        name: "异常处理",
      },
    }),
    createNode("end", "End", 1138, 628),
    loopGroup,
    createNode("loop_link_reader", "ToolNode", 128, 420, {
      parentNode: "loop_group",
      extent: "parent",
      position: { x: 48, y: 136 },
      data: {
        ...getDefaultNodeData("ToolNode"),
        name: "LinkReaderPlugin",
        subtitle: "抓取网页与 PDF",
      },
    }),
    createNode("loop_info_sort", "LLMNode", 468, 320, {
      parentNode: "loop_group",
      extent: "parent",
      position: { x: 460, y: 58 },
    }),
    createNode("loop_filter", "Branch", 468, 470, {
      parentNode: "loop_group",
      extent: "parent",
      position: { x: 460, y: 232 },
      data: {
        ...getDefaultNodeData("Branch"),
        name: "消息",
      },
    }),
    createNode("loop_set_var", "Output", 860, 400, {
      parentNode: "loop_group",
      extent: "parent",
      position: { x: 856, y: 166 },
      data: {
        ...getDefaultNodeData("Output"),
        name: "设置变量",
      },
    }),
  ]

  const edges: WorkflowCanvasEdge[] = [
    createEdge("start", "tool_search"),
    createEdge("start", "selector"),
    createEdge("tool_search", "output_collect"),
    createEdge("selector", "search_result"),
    createEdge("selector", "news_merge"),
    createEdge("search_result", "news_merge"),
    createEdge("news_merge", "end"),
    createEdge("selector", "exception_handle"),
    createEdge("exception_handle", "end"),
    createEdge("loop_link_reader", "loop_info_sort"),
    createEdge("loop_link_reader", "loop_filter"),
    createEdge("loop_info_sort", "loop_set_var"),
    createEdge("loop_filter", "loop_set_var"),
    createEdge("loop_set_var", "news_merge"),
  ]

  return {
    nodes,
    edges,
    viewport: { x: -96, y: -46, zoom: 0.6 },
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
