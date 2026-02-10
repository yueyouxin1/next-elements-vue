import { RangeSetBuilder, type Extension, type RangeSet } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  type DecorationSet,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { createApp, h, type App as VueApp } from 'vue'
import type { MdExpressionRule } from '../types'
import { resolveExpressionMatches, type ExpressionRuleMatch } from './use-expression-rules'

export type ApplyExpressionEditPayload = {
  from: number
  to: number
  newText: string
}

export type ExpressionRenderingOptions = {
  rules: MdExpressionRule[]
  onApplyEdit: (payload: ApplyExpressionEditPayload) => void
}

const isUpdatePayload = (payload: unknown): payload is { newText: string } => {
  if (!payload || typeof payload !== 'object') {
    return false
  }
  return typeof (payload as { newText?: unknown }).newText === 'string'
}

const buildHighlightStyle = (rule: MdExpressionRule): string | undefined => {
  if (!rule.highlightStyle) {
    return undefined
  }

  const chunks = [`background-color:${rule.highlightStyle.backgroundColor}`]
  if (rule.highlightStyle.borderRadius) {
    chunks.push(`border-radius:${rule.highlightStyle.borderRadius}`)
  }
  if (rule.highlightStyle.color) {
    chunks.push(`color:${rule.highlightStyle.color}`)
  }

  return chunks.join(';')
}

class ExpressionReplaceWidget extends WidgetType {
  private readonly view: EditorView
  private readonly match: ExpressionRuleMatch
  private readonly onApplyEdit: (payload: ApplyExpressionEditPayload) => void
  private mountedApp: VueApp<Element> | undefined

  constructor(
    view: EditorView,
    match: ExpressionRuleMatch,
    onApplyEdit: (payload: ApplyExpressionEditPayload) => void,
  ) {
    super()
    this.view = view
    this.match = match
    this.onApplyEdit = onApplyEdit
  }

  eq(other: ExpressionReplaceWidget): boolean {
    return (
      this.match.rule.key === other.match.rule.key &&
      this.match.from === other.match.from &&
      this.match.to === other.match.to &&
      this.match.raw === other.match.raw &&
      this.match.rule.component === other.match.rule.component
    )
  }

  toDOM(): HTMLElement {
    const container = document.createElement(this.match.rule.block ? 'div' : 'span')
    container.className = this.match.rule.block
      ? 'cm-md-expression-widget-host cm-md-expression-widget-block'
      : 'cm-md-expression-widget-host'

    if (!this.match.rule.component) {
      const fallback = document.createElement('span')
      fallback.className = 'cm-md-expression-widget-fallback'
      fallback.textContent = this.match.raw
      container.appendChild(fallback)
      return container
    }

    const target = document.createElement('span')
    target.className = 'cm-md-expression-widget-target'
    container.appendChild(target)

    const componentProps =
      this.match.rule.componentProps?.({
        raw: this.match.raw,
        range: {
          from: this.match.from,
          to: this.match.to,
        },
        view: this.view,
      }) ?? {}

    this.mountedApp = createApp({
      setup: () =>
        () =>
          h(this.match.rule.component!, {
            ...componentProps,
            onUpdate: (payload: unknown) => {
              if (!isUpdatePayload(payload)) {
                return
              }
              this.onApplyEdit({
                from: this.match.from,
                to: this.match.to,
                newText: payload.newText,
              })
            },
            onRemove: () => {
              this.onApplyEdit({
                from: this.match.from,
                to: this.match.to,
                newText: '',
              })
            },
          }),
    })
    this.mountedApp.mount(target)

    return container
  }

  destroy(): void {
    this.mountedApp?.unmount()
    this.mountedApp = undefined
  }
}

export const createExpressionRenderingExtension = (
  options: ExpressionRenderingOptions,
): Extension => {
  class ExpressionRenderingPlugin implements PluginValue {
    decorations: DecorationSet = Decoration.none
    atomicRanges: RangeSet<Decoration> = Decoration.none

    constructor(view: EditorView) {
      this.recomputeDecorations(view)
    }

    update(update: ViewUpdate): void {
      if (!update.docChanged && !update.viewportChanged) {
        return
      }
      this.recomputeDecorations(update.view)
    }

    private recomputeDecorations(view: EditorView): void {
      const docText = view.state.doc.toString()
      const { replaceMatches, highlightMatches } = resolveExpressionMatches(docText, options.rules)

      const decorationBuilder = new RangeSetBuilder<Decoration>()
      const atomicBuilder = new RangeSetBuilder<Decoration>()

      for (const match of replaceMatches) {
        const replaceDecoration = Decoration.replace({
          widget: new ExpressionReplaceWidget(view, match, options.onApplyEdit),
          block: Boolean(match.rule.block),
        })
        decorationBuilder.add(match.from, match.to, replaceDecoration)
        atomicBuilder.add(match.from, match.to, Decoration.mark({}))
      }

      for (const match of highlightMatches) {
        const classNames = ['cm-md-expression-highlight']
        if (match.rule.highlightClass) {
          classNames.push(match.rule.highlightClass)
        }
        const style = buildHighlightStyle(match.rule)
        const highlightDecoration = Decoration.mark({
          class: classNames.join(' '),
          attributes: style ? { style } : undefined,
        })
        decorationBuilder.add(match.from, match.to, highlightDecoration)
      }

      this.decorations = decorationBuilder.finish()
      this.atomicRanges = atomicBuilder.finish()
    }
  }

  const expressionPlugin = ViewPlugin.fromClass(ExpressionRenderingPlugin, {
    decorations: (pluginInstance) => pluginInstance.decorations,
  })

  return [
    EditorView.baseTheme({
      '.cm-md-expression-highlight': {
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        borderRadius: '4px',
        padding: '0 1px',
      },
      '.cm-md-expression-widget-host': {
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'baseline',
      },
      '.cm-md-expression-widget-host.cm-md-expression-widget-block': {
        display: 'block',
        margin: '4px 0',
      },
      '.cm-md-expression-widget-fallback': {
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontSize: '12px',
        lineHeight: '1.4',
        padding: '2px 8px',
      },
    }),
    expressionPlugin,
    EditorView.atomicRanges.of(
      (view) => view.plugin(expressionPlugin)?.atomicRanges ?? Decoration.none,
    ),
  ]
}
