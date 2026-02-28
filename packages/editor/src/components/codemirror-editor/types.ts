import type { Extension } from '@codemirror/state'
import type { EditorView, ViewUpdate } from '@codemirror/view'

export type CodeMirrorEditorLineNumbers = boolean | 'on' | 'off'

export type CodeMirrorEditorExtensions = Extension | Extension[]
export type CodeMirrorEditorLanguage =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'html'
  | 'css'
  | 'markdown'

export interface CodeMirrorEditorProps {
  modelValue: string
  theme?: string
  width?: string | number
  height?: string | number
  placeholder?: string
  fontSize?: number
  lineNumbers?: CodeMirrorEditorLineNumbers
  lineWrapping?: boolean
  readonly?: boolean
  autofocus?: boolean
  language?: CodeMirrorEditorLanguage | CodeMirrorEditorExtensions
  extensions?: CodeMirrorEditorExtensions
}

export interface CodeMirrorEditorReadyPayload {
  view: EditorView
}

export interface CodeMirrorEditorExpose {
  focus: () => void
  blur: () => void
  getView: () => EditorView | undefined
}

export type CodeMirrorEditorViewUpdate = ViewUpdate
