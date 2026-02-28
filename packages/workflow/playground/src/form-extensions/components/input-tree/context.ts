import type { InjectionKey } from "vue"
import { inject, provide } from "vue"

type InputTreeContext = {
  testId?: string
}

const inputTreeContextKey: InjectionKey<InputTreeContext> = Symbol("input-tree-context")

export function provideInputTreeContext(value: InputTreeContext): void {
  provide(inputTreeContextKey, value)
}

export function useInputTreeContext(): InputTreeContext {
  return inject(inputTreeContextKey, {})
}

