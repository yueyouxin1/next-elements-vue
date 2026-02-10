# MonacoEditor

Global component name: `MonacoEditor` (registered by `CommonUiPlugin`).

Local import option:

`import { MonacoEditor } from '@repo/common'`

Key capabilities:

- worker setup for markdown/json/css/html/typescript/javascript
- v-model support (`modelValue` / `update:modelValue`)
- model pooling by `path` for large project reuse
- common shortcut props: `placeholder`, `wordWrap`, `fontSize`, `minimap`, `lineNumbers`
- supports deep-merge configuration from `options` (typed native Monaco options object)
- validation event (`validate`) via Monaco markers
- exposed methods: `focus`, `blur`, `formatDocument`, `getEditor`, `getModel`
