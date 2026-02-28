# Expression Md Editor Demos

该目录用于承载 Markdown 表达式编辑器的两个 Demo 实现：

- `monaco-expression-md-editor`
- `codemirror-expression-md-editor`

## 目录结构

```text
expression-md-editor/
  README.md
  monaco-expression-md-editor/
    MdEditorDemo.vue
    MdEditorVariablePanel.vue
  codemirror-expression-md-editor/
    CodeMirrorMdEditorDemo.vue
    CodeMirrorMdEditorVariablePanel.vue
    CodeMirrorLibraryBlockView.vue
```

## 用法

在 `apps/studio-web/src/data/component-demos.ts` 中已注册两个 Demo：

- `monaco-expression-md-editor`
- `codemirror-expression-md-editor`

打开对应 slug 即可查看示例。

## 能力差异

- Monaco 版本：支持表达式触发弹窗与文本高亮；不支持 block 组件渲染。
- CodeMirror 版本：支持表达式触发弹窗、highlight/replace，并支持 block 组件渲染。
