import { defineAsyncComponent, type App } from 'vue'

export const EditorUiPlugin = {
  install(app: App) {
    app.component(
      'CodeMirrorEditor',
      defineAsyncComponent(() => import('./components/codemirror-editor/CodeMirrorEditor.vue')),
    )
    app.component(
      'CodeMirrorMdEditor',
      defineAsyncComponent(
        () => import('./components/codemirror-editor/codemirror-md-editor/CodeMirrorMdEditor.vue'),
      ),
    )
    app.component(
      'MonacoEditor',
      defineAsyncComponent(() => import('./components/monaco-editor/MonacoEditor.vue')),
    )
    app.component(
      'MdEditor',
      defineAsyncComponent(() => import('./components/monaco-editor/md-editor/MdEditor.vue')),
    )
    app.component(
      'ParamSchemaRegularEditor',
      defineAsyncComponent(
        () => import('./components/param-schema-editor/ui/ParamSchemaRegularEditor.vue'),
      ),
    )
    app.component(
      'ParamSchemaProfessionalEditor',
      defineAsyncComponent(
        () => import('./components/param-schema-editor/ui/ParamSchemaProfessionalEditor.vue'),
      ),
    )
  },
}
