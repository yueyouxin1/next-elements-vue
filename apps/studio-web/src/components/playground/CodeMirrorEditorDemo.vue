<script setup lang="ts">
import { ref } from "vue"
import {
  CodeMirrorEditor,
  type CodeMirrorEditorExpose,
  type CodeMirrorEditorLanguage,
} from "@repo/editor"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"

const editorRef = ref<CodeMirrorEditorExpose>()
const readonly = ref(false)
const lineNumbers = ref<"on" | "off">("on")
const lineWrapping = ref(true)
const theme = ref<"vs-light" | "one-dark">("vs-light")
const language = ref<CodeMirrorEditorLanguage>("typescript")

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

function toggleLineWrapping(): void {
  lineWrapping.value = !lineWrapping.value
}

function toggleTheme(): void {
  theme.value = theme.value === "vs-light" ? "one-dark" : "vs-light"
}

function applyPreset(nextLanguage: CodeMirrorEditorLanguage): void {
  language.value = nextLanguage
  if (nextLanguage === "typescript") {
    content.value = `export function sum(a: number, b: number): number {
  return a + b
}`
    return
  }

  if (nextLanguage === "javascript") {
    content.value = `export function sum(a, b) {
  return a + b
}`
    return
  }

  if (nextLanguage === "json") {
    content.value = `{
  "project": "studio-web",
  "modules": ["editor", "common", "ui-shadcn"]
}`
    return
  }

  if (nextLanguage === "html") {
    content.value = `<section class="card">
  <h1>CodeMirror Editor Demo</h1>
  <p>Reusable editor in playground.</p>
</section>`
    return
  }

  if (nextLanguage === "css") {
    content.value = `.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}`
    return
  }

  content.value = `# CodeMirror Markdown

- Supports markdown syntax highlight
- Language ids align with MonacoEditor

\`\`\`ts
const ok = true
\`\`\``
}

function focusEditor(): void {
  editorRef.value?.focus()
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CodeMirror Editor</CardTitle>
      <CardDescription>
        通用 CodeMirror 代码编辑器：作为 CodeMirrorMdEditor 的基础实现。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('typescript')">
          TS 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('javascript')">
          JS 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('json')">
          JSON 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('html')">
          HTML 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('css')">
          CSS 预设
        </Button>
        <Button type="button" size="sm" variant="secondary" @click="applyPreset('markdown')">
          Markdown 预设
        </Button>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" @click="toggleReadonly">
          Readonly: {{ readonly ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleLineNumbers">
          Line Numbers: {{ lineNumbers }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleLineWrapping">
          Wrap: {{ lineWrapping ? "ON" : "OFF" }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="toggleTheme">
          Theme: {{ theme }}
        </Button>
        <Button type="button" variant="outline" size="sm" @click="focusEditor">
          Focus
        </Button>
      </div>

      <CodeMirrorEditor
        ref="editorRef"
        v-model="content"
        :theme="theme"
        :line-numbers="lineNumbers"
        :line-wrapping="lineWrapping"
        :readonly="readonly"
        :language="language"
        :height="360"
        placeholder="Type code..."
      />

      <div class="rounded-md border bg-muted/40 p-3 text-xs">
        <p class="mb-1 font-medium">Editor State</p>
        <p>Language: {{ language }}</p>
        <p>Theme: {{ theme }}</p>
        <p>Readonly: {{ readonly ? "true" : "false" }}</p>
        <p>Line Numbers: {{ lineNumbers }}</p>
        <p>Word Wrap: {{ lineWrapping ? "on" : "off" }}</p>
      </div>

      <div class="rounded-md border bg-muted/40 p-3 text-xs">
        <p class="mb-1 font-medium">Current Value</p>
        <pre class="max-h-40 overflow-auto whitespace-pre-wrap">{{ content }}</pre>
      </div>
    </CardContent>
  </Card>
</template>
