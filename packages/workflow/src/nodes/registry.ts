import type { WorkflowNodeData, WorkflowRegistryId } from "../base/types"

export type WorkflowNodeRegistryMeta = {
  label: string
  description: string
  chipClass: string
  headerClass: string
  defaultData: WorkflowNodeData
}

function createNodeData(partial: WorkflowNodeData): WorkflowNodeData {
  return {
    registryId: partial.registryId,
    name: partial.name,
    description: partial.description,
    config: { ...partial.config },
    inputs: partial.inputs.map(input => ({ ...input })),
    outputs: partial.outputs.map(output => ({ ...output })),
  }
}

export const workflowNodeRegistry: Record<WorkflowRegistryId, WorkflowNodeRegistryMeta> = {
  Start: {
    label: "开始",
    description: "工作流入口",
    chipClass: "bg-indigo-100 text-indigo-700",
    headerClass: "border-indigo-200 bg-indigo-50/80",
    defaultData: {
      registryId: "Start",
      name: "开始",
      description: "工作流起始节点",
      config: {},
      inputs: [],
      outputs: [{ name: "BOT_USER_INPUT", type: "string", required: true }],
    },
  },
  Output: {
    label: "输出",
    description: "汇总输出内容",
    chipClass: "bg-blue-100 text-blue-700",
    headerClass: "border-blue-200 bg-blue-50/80",
    defaultData: {
      registryId: "Output",
      name: "汇总新闻信息",
      description: "将中间结果整合为响应",
      config: { returnType: "Object", stream: false },
      inputs: [{ name: "input", type: "object" }],
      outputs: [{ name: "all_new", type: "array" }],
    },
  },
  End: {
    label: "结束",
    description: "工作流结束节点",
    chipClass: "bg-violet-100 text-violet-700",
    headerClass: "border-violet-200 bg-violet-50/80",
    defaultData: {
      registryId: "End",
      name: "结束",
      description: "输出最终 analysis",
      config: { returnType: "Text", stream: false, content: "{{ analysis }}" },
      inputs: [{ name: "analysis", type: "string", required: true }],
      outputs: [],
    },
  },
  Branch: {
    label: "分支",
    description: "条件判断",
    chipClass: "bg-cyan-100 text-cyan-700",
    headerClass: "border-cyan-200 bg-cyan-50/80",
    defaultData: {
      registryId: "Branch",
      name: "选择器",
      description: "按搜索结果分流",
      config: {
        branchs: [
          {
            id: "branch-1",
            logic: "&",
            conditions: [
              {
                left: { name: "search.data", type: "array" },
                right: { name: "Empty", type: "string", value: { type: "literal", content: "Empty" } },
                operator: 9,
              },
            ],
          },
        ],
      },
      inputs: [{ name: "search.data", type: "array" }],
      outputs: [{ name: "branch_hit", type: "string" }],
    },
  },
  Loop: {
    label: "循环",
    description: "循环执行子流程",
    chipClass: "bg-emerald-100 text-emerald-700",
    headerClass: "border-emerald-200 bg-emerald-50/80",
    defaultData: {
      registryId: "Loop",
      name: "循环",
      description: "处理批量聚合",
      config: { loopType: "list" },
      inputs: [{ name: "loop_list", type: "array" }],
      outputs: [{ name: "summary", type: "string" }],
    },
  },
  LLMNode: {
    label: "信息梳理",
    description: "大模型归纳",
    chipClass: "bg-orange-100 text-orange-700",
    headerClass: "border-orange-200 bg-orange-50/80",
    defaultData: {
      registryId: "LLMNode",
      name: "信息梳理",
      description: "提炼关键信息",
      config: {
        content: "请总结输入内容",
        agent_config: {
          model_params: { temperature: 0.2, top_p: 0.8 },
        },
      },
      inputs: [{ name: "content", type: "string" }],
      outputs: [{ name: "summary", type: "string" }],
    },
  },
  AgentNode: {
    label: "新闻整合",
    description: "Agent 执行",
    chipClass: "bg-fuchsia-100 text-fuchsia-700",
    headerClass: "border-fuchsia-200 bg-fuchsia-50/80",
    defaultData: {
      registryId: "AgentNode",
      name: "新闻整合",
      description: "整合候选新闻",
      config: {
        resource_instance_uuid: "agent-demo",
        input_query: "{{ all_new }}",
      },
      inputs: [{ name: "input", type: "object" }],
      outputs: [{ name: "output", type: "string" }],
    },
  },
  ToolNode: {
    label: "资料查找",
    description: "工具检索",
    chipClass: "bg-slate-200 text-slate-700",
    headerClass: "border-slate-200 bg-white",
    defaultData: {
      registryId: "ToolNode",
      name: "资料查找",
      description: "检索链接与附件",
      config: {
        resource_instance_uuid: "tool-search",
      },
      inputs: [{ name: "input_query", type: "string" }],
      outputs: [{ name: "data", type: "array" }],
    },
  },
}

export function getDefaultNodeData(registryId: WorkflowRegistryId): WorkflowNodeData {
  return createNodeData(workflowNodeRegistry[registryId].defaultData)
}
