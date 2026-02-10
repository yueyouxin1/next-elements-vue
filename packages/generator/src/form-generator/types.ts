import type { Component } from "vue"
import type {
  Expr,
  FormActionItem,
  FormFieldItem,
  FormItem,
} from "./types/form-schema"

export type FormModel = Record<string, any>
export type FormContext = Record<string, any>

export type FieldOption = {
  label?: string
  value: unknown
  disabled?: boolean
  [key: string]: unknown
}

export type ExpressionRuntimeScope = {
  ctx: FormContext
  context: FormContext
  model: FormModel
  formModel: FormModel
  item?: FormItem
  value?: unknown
  meta?: Record<string, unknown>
}

export type FieldResolveContext = {
  item: FormFieldItem
  model: FormModel
  context: FormContext
  value: unknown
  setValue: (next: unknown) => void
  options: FieldOption[]
  evaluateExpr: <T>(
    expr: Expr<T> | undefined,
    fallback?: T,
    overrides?: Partial<ExpressionRuntimeScope>,
  ) => T | undefined
  resolveDynamic: <T>(value: T, overrides?: Partial<ExpressionRuntimeScope>) => T
}

export type ActionResolveContext = {
  item: FormActionItem
  model: FormModel
  context: FormContext
  evaluateExpr: <T>(
    expr: Expr<T> | undefined,
    fallback?: T,
    overrides?: Partial<ExpressionRuntimeScope>,
  ) => T | undefined
  resolveDynamic: <T>(value: T, overrides?: Partial<ExpressionRuntimeScope>) => T
}

export type FieldRendererDefinition = {
  component: Component
  modelProp?: string
  modelEvent?: string
  getProps?: (ctx: FieldResolveContext) => Record<string, unknown>
  transformInput?: (value: unknown, ctx: FieldResolveContext) => unknown
  transformOutput?: (value: unknown, ctx: FieldResolveContext) => unknown
}

export type ActionRendererDefinition = {
  component: Component
  eventName?: string
  getProps?: (ctx: ActionResolveContext) => Record<string, unknown>
}

export type FieldRendererRecord = Record<string, FieldRendererDefinition>
export type ActionRendererRecord = Record<string, ActionRendererDefinition>

export type RegisterableFieldRenderers =
  | FieldRendererRecord
  | Map<string, FieldRendererDefinition>

export type RegisterableActionRenderers =
  | ActionRendererRecord
  | Map<string, ActionRendererDefinition>

export type FormGeneratorActionEvent = {
  item: FormActionItem
  payload: unknown
}

export type FormGeneratorExposed = {
  registerField: (fieldType: string, renderer: FieldRendererDefinition) => void
  unregisterField: (fieldType: string) => void
  registerAction: (actionType: string, renderer: ActionRendererDefinition) => void
  unregisterAction: (actionType: string) => void
}

