export function expressionTool(
  template: string,
  context: Record<string, any>,
  customHelpers?: Record<string, (...args: any[]) => unknown>,
): unknown
