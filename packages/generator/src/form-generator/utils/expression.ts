import { expressionTool } from "@repo/common/tools/expression-tool.js"
import type { Expr, FormItem } from "../types/form-schema"
import type { ExpressionRuntimeScope, FormContext, FormModel } from "../types"

const HAS_INTERPOLATION_RE = /\{\{[\s\S]*\}\}/

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

export function createExpressionScope(input: {
  model: FormModel
  context?: FormContext
  item?: FormItem
  value?: unknown
  overrides?: Partial<ExpressionRuntimeScope>
}): ExpressionRuntimeScope {
  const baseContext = input.context ?? {}
  const scope: ExpressionRuntimeScope = {
    ctx: baseContext,
    context: baseContext,
    model: input.model,
    formModel: input.model,
    item: input.item,
    value: input.value,
    meta: input.item?.meta,
  }
  return {
    ...scope,
    ...input.overrides,
  }
}

export function isExpressionString(value: unknown): value is string {
  return typeof value === "string" && HAS_INTERPOLATION_RE.test(value)
}

export function evaluateExpression<T>(
  expr: Expr<T> | undefined,
  scope: ExpressionRuntimeScope,
  fallback?: T,
): T | undefined {
  if (expr === undefined) {
    return fallback
  }

  if (typeof expr === "function") {
    return (expr as (ctx: unknown) => T)(scope as any)
  }

  if (isExpressionString(expr)) {
    return expressionTool(expr, scope) as T
  }

  return expr as T
}

export function resolveDynamicValue<T>(
  value: T,
  scope: ExpressionRuntimeScope,
): T {
  if (isExpressionString(value)) {
    return expressionTool(value, scope) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveDynamicValue(item, scope)) as T
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      result[key] = resolveDynamicValue(item, scope)
    }
    return result as T
  }

  return value
}
