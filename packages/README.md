# Packages Layer

`packages/*` is reserved for domain and shared modules.

- `foundation`: app foundation capabilities.
- `arch`: cross-domain architecture capabilities.
- `common`: shared cross-domain modules and utilities (including `expressionTool`).
- `editor`: dedicated editor package (Monaco/CodeMirror editor families and param-schema-editor).
- `domain-demo`: placeholder for the first domain split.
- `generator`: generator/runtime-oriented modules (including dynamic form generator runtime).
- `workflow`: reserved for future workflow subsystems.
- `ui-reka`: reka-ui primitive facade.
- `ui-shadcn`: shadcn-vue component layer.
- `ui-ai-elements`: ai-elements component layer.

Preferred dependency direction:

`ui-ai-elements` -> `ui-shadcn` -> `ui-reka`
