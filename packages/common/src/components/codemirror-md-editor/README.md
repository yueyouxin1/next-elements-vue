# CodeMirrorMdEditor

`CodeMirrorMdEditor` is a markdown-focused editor built on CodeMirror 6.

## Features

- expression popup trigger and insertion (`{{`, `${`)
- rule-driven expression rendering:
  - `replace`: render Vue widget and keep raw markdown in model
  - `highlight`: apply mark decoration without changing text
- multi-rule conflict strategy: `replace` has higher priority than `highlight`

## Basic Usage

```ts
import { CodeMirrorMdEditor, type MdExpressionRule } from '@repo/common'

const rules: MdExpressionRule[] = [
  {
    key: 'var-highlight',
    match: /\{\{[^}]+\}\}/g,
    mode: 'highlight',
    highlightStyle: {
      backgroundColor: 'rgba(59,130,246,0.16)',
      borderRadius: '4px',
    },
  },
]
```

Replace widgets can emit:

- `update`: `{ newText: string }`
- `remove`

The editor applies those edits back to the original markdown text.

