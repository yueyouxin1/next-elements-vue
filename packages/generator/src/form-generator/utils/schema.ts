import { parseFormItems } from "../runtime-schema"
import type { FormItem } from "../types/form-schema"

function getOrder(item: FormItem): number {
  return item.ui?.order ?? Number.MAX_SAFE_INTEGER
}

export function normalizeFormItems(schema: FormItem[]): FormItem[] {
  const normalized = parseFormItems(schema) as FormItem[]
  return [...normalized].sort((left, right) => getOrder(left) - getOrder(right))
}

