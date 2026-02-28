# studio-web

Vue app shell entry.

- runtime bootstrap: `src/core/bootstrap`
- provider registration: `src/core/providers`
- app i18n overrides: `src/core/i18n`
- route aggregation: `src/router/routes`
- layout switching: `src/layouts` + `route.meta.layout`
- app composables: `src/composables`
- app stores: `src/stores`
- app hooks: `src/hooks`
- app types: `src/types`
- styles entry: `src/styles/index.css`
- static assets: `public/*`
- bundled assets: `src/assets/*`
- third-party component consumption via aliases:
  - `@repo/common/*` -> shared cross-app modules (i18n/types/utils)
  - `@repo/editor/*` -> shared editor modules
  - `@repo/ui-ai-elements/*` -> `packages/ui-ai-elements`
  - `@repo/ui-shadcn/*` -> `packages/ui-shadcn`
  - app-local imports use `@app/*`
- globally registered shared UI:
  - `MonacoEditor` / `MdEditor` / `CodeMirrorEditor` / `CodeMirrorMdEditor` from `@repo/editor`
