# MdEditor

`MdEditor` is a markdown-focused wrapper built on `MonacoEditor`.

## Expression Rules

Use `expressionRules` to render markdown expressions by rule:

- `replace`: hide raw text and render a Vue component via `ContentWidget`
- `highlight`: apply visual highlighting via `deltaDecorations`
- `none`: ignore rule

For multi-line replace blocks, MdEditor auto-compensates vertical layout with `viewZone`
so the rendered component does not overlap following text/cursor area.

```ts
import type { MdExpressionRule } from '@repo/editor'

const rules: MdExpressionRule[] = [
  {
    key: 'library-block',
    match: /\{#LibraryBlock[\s\S]*?\{#\/LibraryBlock#\}/g,
    mode: 'replace',
    component: LibraryBlockView,
    componentProps: ({ raw }) => ({ source: raw }),
  },
  {
    key: 'plugin-name',
    match: /bingWebSearch/g,
    mode: 'highlight',
    highlightStyle: {
      backgroundColor: 'rgba(0, 120, 255, 0.15)',
      borderRadius: '4px',
    },
  },
]
```

## Replace Component Events

Replace components should emit:

- `update`: `{ newText: string }`
- `remove`: no payload

MdEditor will apply edits to the original markdown model text.
