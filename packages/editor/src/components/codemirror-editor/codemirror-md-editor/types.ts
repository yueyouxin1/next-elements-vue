import type { Extension } from '@codemirror/state'
import type { EditorView, ViewUpdate } from '@codemirror/view'
import type { Component } from 'vue'
import type { CodeMirrorEditorProps } from '../types'

export type CodeMirrorMdEditorRange = {
  from: number
  to: number
}

export type CodeMirrorExpressionPopupSelectPayload = {
  insertText: string
  replaceRange?: CodeMirrorMdEditorRange
}

export type CodeMirrorExpressionPopupContext = {
  triggerText: string
  queryText: string
  defaultReplaceRange: CodeMirrorMdEditorRange
  position: {
    offset: number
    lineNumber: number
    column: number
  }
}

export type CodeMirrorMdExpressionRuleMode = 'replace' | 'highlight' | 'none'

export type CodeMirrorMdExpressionContext = {
  raw: string
  range: CodeMirrorMdEditorRange
  tagName?: string
  attrs?: Record<string, string>
  content?: string
}

export type CodeMirrorMdExpressionRule = {
  key: string
  match: RegExp
  mode: CodeMirrorMdExpressionRuleMode
  block?: boolean
  component?: Component
  componentProps?: (ctx: CodeMirrorMdExpressionContext) => Record<string, unknown>
  highlightClass?: string
  highlightStyle?: {
    backgroundColor: string
    borderRadius?: string
  }
}

export interface CodeMirrorMdEditorProps
  extends Omit<
    CodeMirrorEditorProps,
    'language' | 'modelValue' | 'readonly' | 'autofocus' | 'extensions'
  > {
  modelValue: string
  readonly?: boolean
  autofocus?: boolean
  triggerPatterns?: RegExp[]
  popupComponent?: Component
  popupProps?: Record<string, unknown>
  expressionRules?: CodeMirrorMdExpressionRule[]
  extensions?: Extension | Extension[]
}

export interface CodeMirrorMdEditorReadyPayload {
  view: EditorView
}

export interface CodeMirrorMdEditorExpose {
  focus: () => void
  blur: () => void
  getView: () => EditorView | undefined
  insertText: (text: string, range?: CodeMirrorMdEditorRange) => void
  hidePopup: () => void
}

export type CodeMirrorMdEditorViewUpdate = ViewUpdate
