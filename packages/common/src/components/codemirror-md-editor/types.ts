import type { EditorView } from '@codemirror/view'
import type { Component } from 'vue'

export type CodeMirrorRange = {
  from: number
  to: number
}

export type ExpressionPopupSelectPayload = {
  insertText: string
  replaceRange?: CodeMirrorRange
}

export type ExpressionPopupContext = {
  triggerText: string
  queryText: string
  defaultReplaceRange: CodeMirrorRange
}

export type MdExpressionRuleMode = 'replace' | 'highlight' | 'none'

export type MdExpressionHighlightStyle = {
  backgroundColor: string
  borderRadius?: string
  color?: string
}

export type ExpressionContext = {
  raw: string
  range: CodeMirrorRange
  view: EditorView
}

export type MdExpressionRule = {
  key: string
  match: RegExp
  mode: MdExpressionRuleMode
  block?: boolean
  component?: Component
  componentProps?: (ctx: ExpressionContext) => Record<string, unknown>
  highlightClass?: string
  highlightStyle?: MdExpressionHighlightStyle
}

export interface CodeMirrorMdEditorProps {
  modelValue: string
  theme?: string
  width?: string | number
  height?: string | number
  placeholder?: string
  fontSize?: number
  lineNumbers?: boolean | 'on' | 'off'
  readonly?: boolean
  autofocus?: boolean
  triggerPatterns?: RegExp[]
  popupComponent?: Component
  popupProps?: Record<string, unknown>
  expressionRules?: MdExpressionRule[]
}

export interface CodeMirrorMdEditorExpose {
  focus: () => void
  blur: () => void
  getView: () => EditorView | undefined
  insertText: (text: string, range?: CodeMirrorRange) => void
  hidePopup: () => void
}

