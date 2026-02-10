import WorkflowEdge from "./WorkflowEdge.vue"
import WorkflowGroupNode from "./WorkflowGroupNode.vue"
import WorkflowNode from "./WorkflowNode.vue"

export { WorkflowEdge, WorkflowGroupNode, WorkflowNode }

export const workflowNodeTypes = {
  workflowNode: WorkflowNode,
  workflowGroup: WorkflowGroupNode,
}

export const workflowEdgeTypes = {
  workflowEdge: WorkflowEdge,
}