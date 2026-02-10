import { defineAsyncComponent, type App } from 'vue'

export const CommonUiPlugin = {
  install(app: App) {
    app.component(
      'CodeMirrorMdEditor',
      defineAsyncComponent(() => import('./components/codemirror-md-editor/CodeMirrorMdEditor.vue')),
    )
    app.component(
      'MonacoEditor',
      defineAsyncComponent(() => import('./components/monaco/MonacoEditor.vue')),
    )
    app.component(
      'MdEditor',
      defineAsyncComponent(() => import('./components/md-editor/MdEditor.vue')),
    )
  },
}
