import type { EditorView } from '@codemirror/view'
import type { CodeMirrorRange, ExpressionPopupContext, ExpressionPopupSelectPayload } from '../types'

export const DEFAULT_TRIGGER_PATTERNS: RegExp[] = [/\{\{[^}\n]*$/, /\$\{[^}\n]*$/]

const normalizePattern = (pattern: RegExp): RegExp => {
  const flags = pattern.flags.replace(/g/g, '')
  return new RegExp(pattern.source, flags)
}

export const findTriggerMatch = (
  view: EditorView,
  triggerPatterns: RegExp[],
): ExpressionPopupContext | null => {
  const selection = view.state.selection.main
  if (!selection.empty) {
    return null
  }

  const cursor = selection.head
  const line = view.state.doc.lineAt(cursor)
  const prefix = line.text.slice(0, cursor - line.from)

  for (const rawPattern of triggerPatterns) {
    const matcher = normalizePattern(rawPattern)
    const matched = matcher.exec(prefix)
    if (!matched || typeof matched.index !== 'number') {
      continue
    }

    const triggerText = matched[0].slice(0, 2)
    if (!triggerText) {
      continue
    }

    const queryText = matched[0].slice(triggerText.length)
    const from = line.from + matched.index
    const to = cursor

    return {
      triggerText,
      queryText,
      defaultReplaceRange: { from, to },
    }
  }

  return null
}

const resolveClosingToken = (insertText: string): string => {
  if (insertText.startsWith('{{')) {
    return '}}'
  }
  if (insertText.startsWith('${')) {
    return '}'
  }
  return ''
}

export const resolvePopupInsertRange = (
  view: EditorView,
  payload: ExpressionPopupSelectPayload,
  fallbackRange: CodeMirrorRange,
): CodeMirrorRange => {
  const docLength = view.state.doc.length
  const baseRange = payload.replaceRange ?? fallbackRange
  const from = Math.max(0, Math.min(baseRange.from, docLength))
  const to = Math.max(from, Math.min(baseRange.to, docLength))
  let normalizedRange: CodeMirrorRange = { from, to }

  const closeToken = resolveClosingToken(payload.insertText)
  if (!closeToken) {
    return normalizedRange
  }

  const lookahead = view.state.doc.sliceString(
    normalizedRange.to,
    Math.min(docLength, normalizedRange.to + closeToken.length),
  )

  let overlap = 0
  for (let index = closeToken.length; index > 0; index -= 1) {
    if (lookahead.startsWith(closeToken.slice(0, index))) {
      overlap = index
      break
    }
  }

  if (overlap > 0) {
    normalizedRange = {
      from: normalizedRange.from,
      to: normalizedRange.to + overlap,
    }
  }

  return normalizedRange
}

export const positionPopupElement = (
  view: EditorView,
  anchorPosition: number,
  popupElement: HTMLElement,
  containerElement: HTMLElement,
): void => {
  const anchorRect = view.coordsAtPos(anchorPosition)
  if (!anchorRect) {
    return
  }

  const containerRect = containerElement.getBoundingClientRect()
  const containerTop = containerElement.scrollTop
  const containerLeft = containerElement.scrollLeft
  const offset = 6

  const popupWidth = popupElement.offsetWidth
  const popupHeight = popupElement.offsetHeight

  const rawLeft = anchorRect.left - containerRect.left + containerLeft
  const maxLeft = Math.max(8, containerElement.clientWidth - popupWidth - 8)
  const left = Math.min(Math.max(8, rawLeft), maxLeft)

  const belowTop = anchorRect.bottom - containerRect.top + containerTop + offset
  const aboveTop = anchorRect.top - containerRect.top + containerTop - popupHeight - offset
  const canPlaceAbove = aboveTop >= containerTop
  const exceedsBottom = belowTop + popupHeight > containerTop + containerElement.clientHeight
  const top = canPlaceAbove && exceedsBottom ? aboveTop : belowTop

  popupElement.style.left = `${left}px`
  popupElement.style.top = `${top}px`
}

