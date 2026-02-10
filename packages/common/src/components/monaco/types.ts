import type * as monaco from 'monaco-editor'

export interface MonacoEditorProps {
  modelValue: string
  language?: string
  path?: string
  theme?: string
  width?: string | number
  height?: string | number
  placeholder?: string
  wordWrap?: monaco.editor.IEditorOptions['wordWrap']
  fontSize?: number
  minimap?: boolean
  lineNumbers?: monaco.editor.LineNumbersType
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  readonly?: boolean
  autofocus?: boolean
}

export interface MonacoEditorExpose {
  focus: () => void
  blur: () => void
  formatDocument: () => Promise<void>
  getEditor: () => monaco.editor.IStandaloneCodeEditor | undefined
  getModel: () => monaco.editor.ITextModel | undefined
}
