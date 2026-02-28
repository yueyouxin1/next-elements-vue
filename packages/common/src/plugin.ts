import type { App } from 'vue'
import { EditorUiPlugin } from '@repo/editor/plugin'

export const CommonUiPlugin = {
  install(app: App) {
    app.use(EditorUiPlugin)
  },
}
