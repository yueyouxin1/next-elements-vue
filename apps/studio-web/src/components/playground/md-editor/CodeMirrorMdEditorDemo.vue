<script setup lang="ts">
import { computed, ref } from "vue"
import {
  CodeMirrorMdEditor,
  type CodeMirrorMdEditorExpose,
  type CodeMirrorMdExpressionRule,
} from "@repo/common"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"
import CodeMirrorLibraryBlockView from "./CodeMirrorLibraryBlockView.vue"
import CodeMirrorMdEditorVariablePanel from "./CodeMirrorMdEditorVariablePanel.vue"

const DEMO_CONTENT = `# CodeMirror Markdown Editor

输入 {{ 或 \${ 触发表达式变量面板。

示例变量：
- {{user.name}}
- {{workflow.id}}

示例 replace block：
{#LibraryBlock name="PrimaryLibrary"#}
Block content
{#/LibraryBlock#}
`

const editorRef = ref<CodeMirrorMdEditorExpose>()
const value = ref(DEMO_CONTENT)
const readonly = ref(false)
const popupEnabled = ref(true)
const highlightEnabled = ref(true)
const replaceEnabled = ref(true)
const lastEvent = ref("等待触发...")

const expressionRules = computed<CodeMirrorMdExpressionRule[]>(() => {
  const rules: CodeMirrorMdExpressionRule[] = []

  if (replaceEnabled.value) {
    rules.push({
      key: "library-block",
      match: /\{#LibraryBlock[\s\S]*?\{#\/LibraryBlock#\}/g,
      mode: "replace",
      block: true,
      component: CodeMirrorLibraryBlockView,
      componentProps: ({ raw }) => ({ source: raw }),
    })
  }

  if (highlightEnabled.value) {
    rules.push(
      {
        key: "expression-highlight",
        match: /\{\{[^}]+\}\}/g,
        mode: "highlight",
        highlightStyle: {
          backgroundColor: "rgba(14, 165, 233, 0.2)",
          borderRadius: "4px",
        },
      },
      {
        key: "workflow-token",
        match: /\bworkflow\b/g,
        mode: "highlight",
        highlightStyle: {
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderRadius: "4px",
        },
      },
    )
  }

  return rules
})

function toggleReadonly(): void {
  readonly.value = !readonly.value
}

function togglePopup(): void {
  popupEnabled.value = !popupEnabled.value
}

function toggleHighlight(): void {
  highlightEnabled.value = !highlightEnabled.value
}

function toggleReplace(): void {
  replaceEnabled.value = !replaceEnabled.value
}

function insertTemplate(): void {
  editorRef.value?.insertText("{{runtime.locale}}")
}

function resetContent(): void {
  value.value = DEMO_CONTENT
  lastEvent.value = "已重置 Demo 内容"
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CodeMirrorMdEditor</CardTitle>
      <CardDescription>
        基于 CodeMirror 6 的 Markdown 编辑器，支持表达式弹窗、replace 与 highlight。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" @click="resetContent">
          重置内容
        </Button>
        <Button type="button" variant="outline" size="sm" @click="insertTemplate">
          插入模板
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleReadonly">
          Readonly: {{ readonly ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="togglePopup">
          Popup: {{ popupEnabled ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleHighlight">
          Highlight: {{ highlightEnabled ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleReplace">
          Replace: {{ replaceEnabled ? "ON" : "OFF" }}
        </Button>
      </div>

      <div class="rounded-md border bg-muted/30 p-3 text-xs leading-6">
        <p class="font-medium">
          检查点
        </p>
        <p>1. 输入 <code>{{ "{{" }}</code> 或 <code>{{ "${" }}</code> 可触发表达式变量弹窗。</p>
        <p>2. replace 渲染不改变底层文本，组件内 Rename/Remove 可回写原文。</p>
        <p>3. 当 replace 与 highlight 命中同一区间时，replace 优先。</p>
      </div>

      <CodeMirrorMdEditor
        ref="editorRef"
        v-model="value"
        theme="vs-light"
        :line-numbers="false"
        :font-size="15"
        :readonly="readonly"
        :popup-component="popupEnabled ? CodeMirrorMdEditorVariablePanel : undefined"
        :trigger-patterns="[/\{\{[^}\n]*$/, /\$\{[^}\n]*$/]"
        :expression-rules="expressionRules"
        :height="460"
        placeholder="输入 Markdown，使用 {{ 或 ${ 触发表达式弹窗"
        @popup-show="lastEvent = `popup-show: ${$event.triggerText}${$event.queryText}`"
        @popup-hide="lastEvent = 'popup-hide'"
        @popup-select="lastEvent = `popup-select: ${$event.insertText}`"
      />

      <div class="rounded-md border bg-muted/40 p-3 text-xs">
        <p class="mb-1 font-medium">
          Last Event
        </p>
        <p>{{ lastEvent }}</p>
      </div>
    </CardContent>
  </Card>
</template>
