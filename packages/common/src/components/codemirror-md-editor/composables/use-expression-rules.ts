import type { MdExpressionRule } from '../types'

export type ExpressionRuleMatch = {
  from: number
  to: number
  raw: string
  rule: MdExpressionRule
  ruleOrder: number
}

export type ResolvedExpressionMatches = {
  replaceMatches: ExpressionRuleMatch[]
  highlightMatches: ExpressionRuleMatch[]
}

const byRangeStart = (left: ExpressionRuleMatch, right: ExpressionRuleMatch): number => {
  if (left.from !== right.from) {
    return left.from - right.from
  }
  if (left.to !== right.to) {
    return right.to - left.to
  }
  return left.ruleOrder - right.ruleOrder
}

const hasOverlap = (from: number, to: number, range: { from: number; to: number }): boolean =>
  from < range.to && to > range.from

const hasOverlapWithAny = (
  from: number,
  to: number,
  ranges: Array<{ from: number; to: number }>,
): boolean => ranges.some((range) => hasOverlap(from, to, range))

export const ensureGlobalRegex = (pattern: RegExp): RegExp => {
  if (pattern.flags.includes('g')) {
    return new RegExp(pattern.source, pattern.flags)
  }
  return new RegExp(pattern.source, `${pattern.flags}g`)
}

const collectMatchesByMode = (
  docText: string,
  rules: MdExpressionRule[],
  targetMode: 'replace' | 'highlight',
): ExpressionRuleMatch[] => {
  const matches: ExpressionRuleMatch[] = []

  for (let ruleOrder = 0; ruleOrder < rules.length; ruleOrder += 1) {
    const rule = rules[ruleOrder]
    if (!rule) {
      continue
    }
    if (rule.mode !== targetMode) {
      continue
    }

    const matcher = ensureGlobalRegex(rule.match)
    let result: RegExpExecArray | null

    while ((result = matcher.exec(docText)) !== null) {
      const raw = result[0]
      if (!raw) {
        matcher.lastIndex += 1
        continue
      }

      const from = result.index
      const to = from + raw.length
      matches.push({ from, to, raw, rule, ruleOrder })
    }
  }

  return matches.sort(byRangeStart)
}

export const resolveExpressionMatches = (
  docText: string,
  rules: MdExpressionRule[],
): ResolvedExpressionMatches => {
  const replaceCandidates = collectMatchesByMode(docText, rules, 'replace')
  const selectedReplace: ExpressionRuleMatch[] = []
  const occupiedRanges: Array<{ from: number; to: number }> = []

  for (const match of replaceCandidates) {
    if (hasOverlapWithAny(match.from, match.to, occupiedRanges)) {
      continue
    }
    selectedReplace.push(match)
    occupiedRanges.push({ from: match.from, to: match.to })
  }

  const highlightCandidates = collectMatchesByMode(docText, rules, 'highlight')
  const highlightMatches = highlightCandidates.filter(
    (match) => !hasOverlapWithAny(match.from, match.to, occupiedRanges),
  )

  return {
    replaceMatches: selectedReplace,
    highlightMatches,
  }
}
