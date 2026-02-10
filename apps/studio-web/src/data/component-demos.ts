import type { Component } from "vue"
import AlertStatusDemo from "@app/components/playground/AlertStatusDemo.vue"
import ButtonVariantsDemo from "@app/components/playground/ButtonVariantsDemo.vue"
import CodeMirrorMdEditorDemo from "@app/components/playground/md-editor/CodeMirrorMdEditorDemo.vue"
import FormGeneratorDemo from "@app/components/playground/form-generator/FormGeneratorDemo.vue"
import FormCardDemo from "@app/components/playground/FormCardDemo.vue"
import MdEditorDemo from "@app/components/playground/md-editor/MdEditorDemo.vue"
import MonacoEditorDemo from "@app/components/playground/MonacoEditorDemo.vue"
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
    slug: "md-editor",
    title: "Md Editor",
    description: "基于 Monaco 的 Markdown 编辑器，支持表达式触发自定义 Vue 弹窗。",
    tags: ["markdown", "editor", "expression", "popup"],
    component: MdEditorDemo,
  },
  {
    slug: "codemirror-md-editor",
    title: "CodeMirror Md Editor",
    description: "基于 CodeMirror 6 的 Markdown 编辑器，支持表达式 replace/highlight 与变量面板。",
    tags: ["markdown", "editor", "codemirror", "expression"],
    component: CodeMirrorMdEditorDemo,
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
