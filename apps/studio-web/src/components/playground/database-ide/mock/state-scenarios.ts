export type DemoScenario = "default" | "empty" | "error" | "edge"

export type ScenarioDescriptor = {
  label: string
  description: string
}

export const scenarioDescriptors: Record<DemoScenario, ScenarioDescriptor> = {
  default: {
    label: "默认",
    description: "返回标准结果集，用于主流程演示。",
  },
  empty: {
    label: "空态",
    description: "返回 0 行数据，验证 Empty 反馈。",
  },
  error: {
    label: "错误态",
    description: "返回可复现错误信息，验证异常提示与状态跃迁。",
  },
  edge: {
    label: "边界态",
    description: "返回长文本、null、零值等边界数据。",
  },
}
