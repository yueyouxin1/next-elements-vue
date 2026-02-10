import * as monacoApi from 'monaco-editor/esm/vs/editor/editor.api.js'
import type * as monacoType from 'monaco-editor'

export const monaco = monacoApi as unknown as typeof monacoType
