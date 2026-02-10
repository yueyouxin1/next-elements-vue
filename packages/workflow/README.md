# workflow

Workflow 子包，提供工作流画布编辑器、节点渲染、运行时 mock 与 demo 编排能力。

## 包定位

- 以 `shadcn-vue` + `vue-flow` 为基础，实现可扩展的 Workflow Studio。
- 对齐 `workflow-runtime-mock-guide.md` 的图结构和运行事件契约。
- 支持 `Start / Output / End / Branch / Loop / LLMNode / AgentNode / ToolNode` 8 类节点。

## 对外导出

- `@repo/workflow`：
  `src/base/*`（类型、默认图、校验、mock 运行时）
  `src/nodes/*`（节点注册）
  `src/render/*`（节点/连线渲染）
- `@repo/workflow/playground/src/editor/WorkflowStudio.vue`：
  Studio 主编辑器组件

## Demo

- 组件 demo `slug`：`workflow-studio`
- demo 文件：`apps/studio-web/src/components/playground/workflow/WorkflowStudioDemo.vue`
