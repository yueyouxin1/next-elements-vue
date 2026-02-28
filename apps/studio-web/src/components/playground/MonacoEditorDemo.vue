<script setup lang="ts">
import { ref } from "vue"
import { MonacoEditor, type MonacoEditorExpose } from "@repo/editor"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"

type MonacoLanguage = "typescript" | "javascript" | "json" | "html" | "css" | "markdown"
type MonacoTheme = "vs-dark" | "vs-light" | "hc-black"
type MonacoLineNumbers = "on" | "off" | "relative" | "interval"

const editorRef = ref<MonacoEditorExpose>()
const readonly = ref(false)
const language = ref<MonacoLanguage>("typescript")
const theme = ref<MonacoTheme>("vs-dark")
const lineNumbers = ref<MonacoLineNumbers>("on")
const wordWrap = ref<"off" | "on">("on")
const placeholder = ref("请输入或粘贴代码...")
const markerCount = ref(0)

const content = ref(`type User = {
  id: string
  name: string
  age?: number
}

const current: User = {
  id: "u_1",
  name: "Studio"
}

export const greeting = (user: User): string => {
  return \`Hello, \${user.name}\`
}`)

function toggleReadonly(): void {
  readonly.value = !readonly.value
}

function toggleLineNumbers(): void {
  lineNumbers.value = lineNumbers.value === "on" ? "off" : "on"
}

function applyPreset(kind: "ts" | "json" | "html" | "md"): void {
  if (kind === "ts") {
    language.value = "typescript"
    content.value = `export function sum(a: number, b: number): number {
  return a + b
}`
    return
  }

  if (kind === "json") {
    language.value = "json"
    content.value = `{
  "project": "studio-web",
  "modules": ["ai-elements", "reka-ui", "shadcn-vue"]
}`
    return
  }

  if (kind === "md") {
    language.value = "markdown"
    content.value = `# Monaco Markdown

- Supports markdown syntax highlight
- Supports custom native options

\`\`\`ts
const ok = true
\`\`\``
    return
  }

  language.value = "html"
  content.value = `<section class="card">
  <h1>Monaco Editor Demo</h1>
  <p>Reusable editor in playground.</p>
</section>`
}

async function formatCode(): Promise<void> {
  await editorRef.value?.formatDocument()
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Monaco Editor</CardTitle>
      <CardDescription>
        可复用代码编辑器示例：语言切换、主题切换、只读状态、格式化与校验反馈。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" @click="toggleReadonly">
          Readonly: {{ readonly ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleLineNumbers">
          Line Numbers: {{ lineNumbers }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="theme = theme === 'vs-dark' ? 'vs-light' : 'vs-dark'">
          Theme: {{ theme }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="formatCode">
          Format
        </Button>
        <Button type="button" variant="outline" size="sm" @click="wordWrap = wordWrap === 'on' ? 'off' : 'on'">
          Word Wrap: {{ wordWrap }}
        </Button>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('ts')">
          TS 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('json')">
          JSON 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('html')">
          HTML 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('md')">
          Markdown 预设
        </Button>
      </div>

      <MonacoEditor
        ref="editorRef"
        v-model="content"
        :language="language"
        :theme="theme"
        :line-numbers="lineNumbers"
        :word-wrap="wordWrap"
        :placeholder="placeholder"
        :readonly="readonly"
        :options="{ tabSize: 2, guides: { indentation: true } }"
        path="playground/monaco-demo"
        :height="380"
        @validate="markerCount = $event.length"
      />

      <div class="grid gap-3 text-xs md:grid-cols-2">
        <div class="rounded-md border bg-muted/40 p-3">
          <p class="mb-1 font-medium">Editor State</p>
          <p>Language: {{ language }}</p>
          <p>Theme: {{ theme }}</p>
          <p>Readonly: {{ readonly ? "true" : "false" }}</p>
          <p>Line Numbers: {{ lineNumbers }}</p>
          <p>Word Wrap: {{ wordWrap }}</p>
          <p>Validation Markers: {{ markerCount }}</p>
        </div>
        <div class="rounded-md border bg-muted/40 p-3">
          <p class="mb-1 font-medium">Current Value</p>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap">{{ content }}</pre>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
