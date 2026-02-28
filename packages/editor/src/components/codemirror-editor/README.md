# CodeMirrorEditor

`CodeMirrorEditor` is a reusable CodeMirror 6 code editor wrapper.

Local import option:

`import { CodeMirrorEditor } from '@repo/editor'`

Key capabilities:

- `v-model` support (`modelValue` / `update:modelValue`)
- runtime toggles: `theme`, `readonly`, `lineNumbers`, `lineWrapping`, `placeholder`, `fontSize`
- `language` supports Monaco-aligned ids: `typescript` / `javascript` / `json` / `html` / `css` / `markdown`
- still supports custom `extensions` and direct language extension injection
- exposed methods: `focus`, `blur`, `getView`

`CodeMirrorMdEditor` is built on top of this component.
