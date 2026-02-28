<script setup lang="ts">
import { computed, ref } from "vue"
import {
  CodeMirrorMdEditor,
  type CodeMirrorMdEditorExpose,
  type CodeMirrorMdExpressionRule,
} from "@repo/editor"
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

const DEMO_CONTENT = `# Markdown Edit

## Tool
1. {#LibraryBlock id="7362079843678273590" uuid="w2shUuux5rh6TVl-AIxh9" type="plugin" apiId="7362079843678289974"#}bingWebSearch{#/LibraryBlock#}
2. {#LibraryBlock id="7597789749614002226" uuid="bY3xRJ02oVLgmUgqObPO-" type="text"#}测试文档{#/LibraryBlock#}

### User
Hello`

const editorRef = ref<CodeMirrorMdEditorExpose>()
const value = ref(DEMO_CONTENT)
const readonly = ref(false)
const popupEnabled = ref(true)
const replaceEnabled = ref(true)
const highlightEnabled = ref(true)
const lastEvent = ref("等待触发...")

const baseReplaceRule: CodeMirrorMdExpressionRule = {
  key: "library-block",
  match: /\{#LibraryBlock[\s\S]*?\{#\/LibraryBlock#\}/g,
  mode: "replace",
  component: CodeMirrorLibraryBlockView,
  componentProps: (ctx) => ({
    title: ctx.content ?? "",
    type: ctx.attrs?.type ?? "plugin",
  }),
}

const baseHighlightRule: CodeMirrorMdExpressionRule = {
  key: "hello-highlight",
  match: /\bHello\b/g,
  mode: "highlight",
  highlightStyle: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderRadius: "4px",
  },
}

const expressionRules = computed<CodeMirrorMdExpressionRule[]>(() => {
  const rules: CodeMirrorMdExpressionRule[] = []
  if (replaceEnabled.value) {
    rules.push(baseReplaceRule)
  }
  if (highlightEnabled.value) {
    rules.push(baseHighlightRule)
  }
  return rules
})

function toggleReadonly(): void {
  readonly.value = !readonly.value
}

function togglePopup(): void {
  popupEnabled.value = !popupEnabled.value
}

function toggleReplace(): void {
  replaceEnabled.value = !replaceEnabled.value
}

function toggleHighlight(): void {
  highlightEnabled.value = !highlightEnabled.value
}

function insertTemplate(): void {
  editorRef.value?.insertText("{{workflow.id}}")
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
        CodeMirror 6 Markdown 表达式编辑器，支持触发弹窗、highlight/replace 和 LibraryBlock 组件渲染。
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
        <Button type="button" variant="outline" size="sm" @click="toggleReplace">
          Replace: {{ replaceEnabled ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleHighlight">
          Highlight: {{ highlightEnabled ? "ON" : "OFF" }}
        </Button>
      </div>

      <div class="rounded-md border bg-muted/30 p-3 text-xs leading-6">
        <p class="font-medium">检查点</p>
        <p>1. 输入 <code>{{ "{{" }}</code> 或 <code>{{ "${" }}</code> 触发变量弹窗并插入表达式。</p>
        <p>2. `LibraryBlock` 原始文本会被替换成组件 UI，模型仍保存原始 Markdown。</p>
      </div>

      <CodeMirrorMdEditor
        ref="editorRef"
        v-model="value"
        theme="vs-light"
        lineNumbers="off"
        :fontSize="15"
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
        <p class="mb-1 font-medium">Last Event</p>
        <p>{{ lastEvent }}</p>
      </div>
    </CardContent>
  </Card>
</template>
