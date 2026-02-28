import { computed, type ComputedRef } from "vue"
import { TreeIndentWidth } from "../constants"

type ColumnStyle = {
  flex: string
}

export type InputTreeColumnsStyle = {
  name: ColumnStyle
  value: ColumnStyle
}

function parseRatio(columnsRatio: string | undefined): [number, number] {
  const ratios = (columnsRatio ?? "3:2")
    .split(":")
    .map(item => Number(item))
  const rawNameWidth = ratios[0]
  const rawValueWidth = ratios[1]
  const nameWidth = typeof rawNameWidth === "number" ? rawNameWidth : Number.NaN
  const valueWidth = typeof rawValueWidth === "number" ? rawValueWidth : Number.NaN

  if (!Number.isFinite(nameWidth) || nameWidth <= 0) {
    return [3, 2]
  }
  if (!Number.isFinite(valueWidth) || valueWidth <= 0) {
    return [3, 2]
  }
  return [nameWidth, valueWidth]
}

export function useColumnsStyle(
  columnsRatio: () => string | undefined,
  level: () => number,
): ComputedRef<InputTreeColumnsStyle> {
  return computed(() => {
    const [nameWidth, valueWidth] = parseRatio(columnsRatio())
    const currentLevel = level()
    return {
      name: {
        flex: `${nameWidth} ${nameWidth} 0`,
      },
      value: {
        flex: `${valueWidth} ${valueWidth} ${(currentLevel * TreeIndentWidth * valueWidth) / nameWidth}px`,
      },
    }
  })
}
