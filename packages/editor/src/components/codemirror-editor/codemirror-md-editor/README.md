# CodeMirrorMdEditor

`CodeMirrorMdEditor` is a markdown-focused editor built on top of `CodeMirrorEditor`.

## Expression Rules

Use `expressionRules` for markdown expression rendering:

- `replace`: hide source text and render Vue component widgets
- `highlight`: render source text with class-based background highlight
- `none`: keep source text unchanged

`replace` has higher priority than `highlight` on overlapping ranges.

```ts
import type { CodeMirrorMdExpressionRule } from '@repo/editor'

const rules: CodeMirrorMdExpressionRule[] = [
  {
    key: 'library-block',
    match: /\{#LibraryBlock[\s\S]*?\{#\/LibraryBlock#\}/g,
    mode: 'replace',
    component: LibraryBlockView,
    componentProps: ({ attrs, content }) => ({
      type: attrs?.type,
      title: content,
    }),
  },
  {
    key: 'plugin-highlight',
    match: /\bplugin\b/g,
    mode: 'highlight',
    highlightStyle: {
      backgroundColor: 'rgba(34, 197, 94, 0.16)',
      borderRadius: '4px',
    },
  },
]
```

## Popup Trigger

Expression popup can be enabled through `popupComponent` and `triggerPatterns`.

Default trigger patterns:

- `/\{\{[^}\n]*$/`
- `/\$\{[^}\n]*$/`

## Replace Component Events

Replace components may emit:

- `update`: `{ newText: string }`
- `remove`: no payload

The editor applies updates directly to the original markdown text.
