import type { Component } from "vue"
import AlertStatusDemo from "@app/components/playground/AlertStatusDemo.vue"
import ButtonVariantsDemo from "@app/components/playground/ButtonVariantsDemo.vue"
import CodeMirrorEditorDemo from "@app/components/playground/CodeMirrorEditorDemo.vue"
import CodeMirrorMdEditorDemo from "@app/components/playground/expression-md-editor/codemirror-expression-md-editor/CodeMirrorMdEditorDemo.vue"
import DashBoardDemo from "@app/components/playground/dashBoard-demo/DashBoard.vue"
import FormGeneratorDemo from "@app/components/playground/form-generator/FormGeneratorDemo.vue"
import FormCardDemo from "@app/components/playground/FormCardDemo.vue"
import MdEditorDemo from "@app/components/playground/expression-md-editor/monaco-expression-md-editor/MdEditorDemo.vue"
import MonacoEditorDemo from "@app/components/playground/MonacoEditorDemo.vue"
import ParamSchemaEditorsDemo from "@app/components/playground/param-schema-editor/ParamSchemaEditorsDemo.vue"
import WorkflowInputTreeDemo from "@app/components/playground/workflow-input-tree/WorkflowInputTreeDemo.vue"
import WorkflowStudioDemo from "@app/components/playground/workflow/WorkflowStudioDemo.vue"

export type ComponentDemo = {
  slug: string
  title: string
  description: string
  tags: string[]
  component: Component
}

export const componentDemos: ComponentDemo[] = [
  {
    slug: "dashboard",
    title: "DashBoard",
    description: "标准 Dashboard UI 风格参考实现，包含侧边栏、统计卡片与数据表格。",
    tags: ["dashboard", "standard-ui", "reference"],
    component: DashBoardDemo,
  },
  {
    slug: "button-variants",
    title: "Button",
    description: "展示按钮的 variant 与 size 组合，便于统一交互规范。",
    tags: ["button", "variant", "size"],
    component: ButtonVariantsDemo,
  },
  {
    slug: "alert-status",
    title: "Alert",
    description: "展示默认与 destructive 两种告警样式。",
    tags: ["alert", "status", "feedback"],
    component: AlertStatusDemo,
  },
  {
    slug: "form-card",
    title: "Form Card",
    description: "展示 Card、Input、Button 的表单组合示例。",
    tags: ["card", "input", "form"],
    component: FormCardDemo,
  },
  {
    slug: "form-generator",
    title: "Form Generator",
    description: "基于 schema 的动态表单生成器，支持 context 联动与自定义字段注册。",
    tags: ["schema", "form", "generator", "dynamic"],
    component: FormGeneratorDemo,
  },
  {
    slug: "monaco-editor",
    title: "Monaco Editor",
    description: "全局可复用 MonacoEditor：语言/主题切换、格式化与校验状态示例。",
    tags: ["editor", "monaco", "code", "shared"],
    component: MonacoEditorDemo,
  },
  {
    slug: "codemirror-editor",
    title: "CodeMirror Editor",
    description: "全局可复用 CodeMirrorEditor：支持语言扩展、只读、换行与主题切换。",
    tags: ["editor", "codemirror", "code", "shared"],
    component: CodeMirrorEditorDemo,
  },
  {
    slug: "monaco-expression-md-editor",
    title: "Monaco Expression Md Editor",
    description: "基于 Monaco 的 Markdown 表达式编辑器，支持表达式弹窗与高亮，不支持 block 组件渲染。",
    tags: ["markdown", "editor", "expression", "popup"],
    component: MdEditorDemo,
  },
  {
    slug: "codemirror-expression-md-editor",
    title: "CodeMirror Expression Md Editor",
    description: "基于 CodeMirror 6 的 Markdown 表达式编辑器，支持 replace/highlight、变量面板和 block 组件渲染。",
    tags: ["markdown", "editor", "codemirror", "expression"],
    component: CodeMirrorMdEditorDemo,
  },
  {
    slug: "param-schema-editor",
    title: "Param Schema Editor",
    description: "参数 Schema 编辑器迁移版：regular/professional 独立组件，支持导入导出、校验、undo/redo。",
    tags: ["schema", "parameter", "editor", "runtime", "json-schema"],
    component: ParamSchemaEditorsDemo,
  },
  {
    slug: "workflow-input-tree",
    title: "Workflow Input Tree",
    description: "InputTree 像素级复刻 demo：支持层级编辑、折叠、列宽比与限制态展示。",
    tags: ["workflow", "input-tree", "form", "playground"],
    component: WorkflowInputTreeDemo,
  },
  {
    slug: "workflow-studio",
    title: "Workflow Studio",
    description: "Workflow 画布编辑器像素级复刻 demo：节点连线、配置面板与试运行回放。",
    tags: ["workflow", "canvas", "node", "playground"],
    component: WorkflowStudioDemo,
  },
]

const demoMap = new Map(componentDemos.map(item => [item.slug, item]))

export const getComponentDemoBySlug = (slug: string) => demoMap.get(slug)
