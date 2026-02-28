import type { Edge as FlowEdge, Node as FlowNode } from "@vue-flow/core"

export type WorkflowRegistryId =
  | "Start"
  | "Output"
  | "End"
  | "Branch"
  | "Loop"
  | "LLMNode"
  | "AgentNode"
  | "ToolNode"

export type SchemaType = "string" | "number" | "integer" | "boolean" | "object" | "array"

export type ValueRefContent = {
  blockID: string
  path: string
  source?: string
}

export type ParameterValue =
  | { type: "literal"; content: unknown }
  | { type: "expr"; content: string }
  | { type: "ref"; content: ValueRefContent }

export type ParameterSchema = {
  name: string
  type: SchemaType
  required?: boolean
  description?: string
  value?: ParameterValue
  properties?: ParameterSchema[]
}

export type WorkflowNodeConfig = {
  stream?: boolean
  returnType?: "Object" | "Text"
  content?: string | null
  executionPolicy?: {
    switch?: boolean
    timeoutMs?: number
    retryTimes?: number
    processType?: 1 | 2 | 3
    dataOnErr?: string | null
  }
  [key: string]: unknown
}

export type WorkflowNodeData = {
  registryId: WorkflowRegistryId
  name: string
  description?: string
  config: WorkflowNodeConfig
  inputs: ParameterSchema[]
  outputs: ParameterSchema[]
}

export type WorkflowCanvasNodeData = WorkflowNodeData & {
  status?: WorkflowNodeRunStatus
  subtitle?: string
  muted?: boolean
  groupLabel?: string
  isLoopBody?: boolean
  loopPartnerId?: string
  loopScopeId?: string
}

export type WorkflowCanvasNode = Omit<FlowNode<WorkflowCanvasNodeData>, "data"> & {
  data: WorkflowCanvasNodeData
}

export type WorkflowCanvasEdge = FlowEdge

export type WorkflowGraphDef = {
  nodes: WorkflowCanvasNode[]
  edges: WorkflowCanvasEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

export type WorkflowRunEventName =
  | "start"
  | "node_start"
  | "node_finish"
  | "node_error"
  | "node_skipped"
  | "stream_start"
  | "stream_chunk"
  | "stream_end"
  | "finish"

export type WorkflowNodeRunStatus =
  | "IDLE"
  | "RUNNING"
  | "COMPLETED"
  | "SKIPPED"
  | "FAILED"

export type WorkflowRunEvent = {
  event: WorkflowRunEventName
  timestamp: number
  nodeId?: string
  payload?: Record<string, unknown>
}

export type WorkflowStudioMode = "default" | "readonly" | "disabled" | "loading" | "error" | "empty"

export type WorkflowValidationIssue = {
  code: "NO_START" | "NO_END" | "MULTIPLE_START" | "MULTIPLE_END" | "UNCONNECTED"
  message: string
}
