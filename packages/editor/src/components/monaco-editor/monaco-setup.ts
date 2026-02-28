import 'monaco-editor/min/vs/editor/editor.main.css'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js'
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js'
import 'monaco-editor/esm/vs/language/html/monaco.contribution.js'
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js'
import { ensureMonacoWorkers } from './monaco-workers'
import { monaco } from './monaco-api'

let initialized = false

export const setupMonaco = () => {
  if (!initialized) {
    ensureMonacoWorkers()
    initialized = true
  }

  return monaco
}
