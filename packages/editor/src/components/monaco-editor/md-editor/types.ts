import type { Component } from 'vue'
import type * as monaco from 'monaco-editor'
import type { MonacoEditorProps } from '../types'

export type ExpressionPopupSelectPayload = {
  insertText: string
  replaceRange?: monaco.IRange
}

export type ExpressionPopupContext = {
  position: monaco.IPosition
  triggerText: string
  queryText: string
  defaultReplaceRange: monaco.IRange
}

export type MdExpressionRuleMode = 'highlight' | 'none'

export type MdExpressionRule = {
  key: string
  match: RegExp
  mode: MdExpressionRuleMode
  highlightStyle?: {
    backgroundColor: string
    borderRadius?: string
  }
}

export interface MdEditorProps
  extends Omit<
    MonacoEditorProps,
    'language' | 'path' | 'modelValue' | 'update:modelValue' | 'readonly' | 'autofocus'
  > {
  modelValue: string
  path?: string
  readonly?: boolean
  autofocus?: boolean
  triggerPatterns?: RegExp[]
  popupComponent?: Component
  popupProps?: Record<string, unknown>
  expressionRules?: MdExpressionRule[]
}

export interface MdEditorExpose {
  focus: () => void
  blur: () => void
  formatDocument: () => Promise<void>
  getEditor: () => monaco.editor.IStandaloneCodeEditor | undefined
  getModel: () => monaco.editor.ITextModel | undefined
  insertText: (text: string, range?: monaco.IRange) => void
  hidePopup: () => void
}
