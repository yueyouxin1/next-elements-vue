<script setup lang="ts">
import { RangeSetBuilder, type Extension } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { createApp, h, nextTick, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import CodeMirrorEditor from '../CodeMirrorEditor.vue'
import type {
  CodeMirrorEditorExpose,
  CodeMirrorEditorReadyPayload,
  CodeMirrorEditorViewUpdate,
} from '../types'
import type {
  CodeMirrorExpressionPopupContext,
  CodeMirrorExpressionPopupSelectPayload,
  CodeMirrorMdEditorExpose,
  CodeMirrorMdEditorProps,
  CodeMirrorMdEditorRange,
  CodeMirrorMdExpressionContext,
  CodeMirrorMdExpressionRule,
} from './types'

type TriggerMatch = {
  triggerText: string
  queryText: string
  replaceRange: CodeMirrorMdEditorRange
  position: {
    offset: number
    lineNumber: number
    column: number
  }
}

type ReplaceRange = {
  from: number
  to: number
}

const props = withDefaults(defineProps<CodeMirrorMdEditorProps>(), {
  theme: 'vs-light',
  width: '100%',
  height: '320px',
  placeholder: '',
  fontSize: 13,
  lineNumbers: true,
  lineWrapping: false,
  readonly: false,
  autofocus: false,
  triggerPatterns: () => [/\{\{[^}\n]*$/, /\$\{[^}\n]*$/],
  popupComponent: undefined,
  popupProps: undefined,
  expressionRules: () => [],
  extensions: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { view: EditorView }): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'view-update', payload: ViewUpdate): void
  (e: 'error', error: unknown): void
  (e: 'popup-show', payload: CodeMirrorExpressionPopupContext): void
  (e: 'popup-hide'): void
  (e: 'popup-select', payload: CodeMirrorExpressionPopupSelectPayload): void
}>()

const editorRef = ref<CodeMirrorEditorExpose>()
const rootRef = ref<HTMLElement>()
const popupContainerRef = ref<HTMLElement>()
const popupVisible = ref(false)
const popupContext = ref<CodeMirrorExpressionPopupContext>()
const popupStyle = ref({
  top: '0px',
  left: '0px',
})
const suppressNextTrigger = ref(false)

let view: EditorView | undefined
let styleElement: HTMLStyleElement | undefined
let pointerDownInsidePopup = false

const toSafeClassToken = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-')

const ensureGlobalRegex = (pattern: RegExp): RegExp => {
  if (pattern.flags.includes('g')) {
    return new RegExp(pattern.source, pattern.flags)
  }
  return new RegExp(pattern.source, `${pattern.flags}g`)
}

const normalizeExtensions = (input: Extension | Extension[] | undefined): Extension[] => {
  if (!input) {
    return []
  }
  return Array.isArray(input) ? input : [input]
}

const clampOffset = (value: number, max: number): number => {
  if (value < 0) {
    return 0
  }
  if (value > max) {
    return max
  }
  return value
}

const normalizeRange = (range: CodeMirrorMdEditorRange, length: number): CodeMirrorMdEditorRange => {
  const from = clampOffset(Math.min(range.from, range.to), length)
  const to = clampOffset(Math.max(range.from, range.to), length)
  return { from, to }
}

const parseExpressionContext = (
  raw: string,
  range: CodeMirrorMdEditorRange,
): CodeMirrorMdExpressionContext => {
  const match = /^\{#([A-Za-z0-9_-]+)\s*([^#}]*)#\}([\s\S]*?)\{#\/\1#\}$/.exec(raw)
  if (!match) {
    return { raw, range }
  }

  const tagName = match[1]
  const attrsText = match[2] ?? ''
  const content = match[3] ?? ''
  if (!tagName) {
    return { raw, range }
  }
  const attrs: Record<string, string> = {}
  const attrMatcher = /([a-zA-Z_][\w-]*)="([^"]*)"/g
  let attrMatch: RegExpExecArray | null
  while ((attrMatch = attrMatcher.exec(attrsText)) !== null) {
    const attrKey = attrMatch[1]
    const attrValue = attrMatch[2]
    if (!attrKey || attrValue === undefined) {
      continue
    }
    attrs[attrKey] = attrValue
  }

  return {
    raw,
    range,
    tagName,
    attrs,
    content,
  }
}

const rangesOverlap = (range: ReplaceRange, occupied: ReplaceRange[]): boolean => {
  return occupied.some(item => range.from < item.to && range.to > item.from)
}

const getHighlightClassName = (rule: CodeMirrorMdExpressionRule): string => {
  if (rule.highlightClass) {
    return rule.highlightClass
  }
  return `cm-md-editor-highlight-${toSafeClassToken(rule.key)}`
}

const updateRuleStyles = (): void => {
  const css: string[] = []

  for (const rule of props.expressionRules) {
    if (rule.mode !== 'highlight' || !rule.highlightStyle) {
      continue
    }

    const className = getHighlightClassName(rule)
    const borderRadius = rule.highlightStyle.borderRadius ?? '4px'
    css.push(`.${className}{background:${rule.highlightStyle.backgroundColor};border-radius:${borderRadius};}`)
  }

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-codemirror-md-editor-expression-styles', 'true')
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = css.join('\n')
}

const removeStyleElement = (): void => {
  styleElement?.remove()
  styleElement = undefined
}

const hidePopup = (): void => {
  if (!popupVisible.value) {
    return
  }

  popupVisible.value = false
  popupContext.value = undefined
  emit('popup-hide')
}

const closePopupByEscape = (): boolean => {
  if (!popupVisible.value) {
    return false
  }
  hidePopup()
  return true
}

const createMarkdownAppearanceExtension = (): Extension => {
  return EditorView.theme({
    '&': {
      color: '#1f2937',
    },
    '.cm-scroller': {
      fontFamily:
        '"SF Pro Text", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif',
    },
    '.cm-content': {
      lineHeight: '1.75',
      textDecoration: 'none',
    },
    '.cm-line': {
      textDecoration: 'none',
      letterSpacing: '0.01em',
    },
    '.cm-content *': {
      textDecoration: 'none !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#0f766e',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-selectionLayer .cm-selectionBackground':
      {
        backgroundColor: 'rgba(15, 118, 110, 0.2) !important',
      },
  })
}

const createExpressionAutoCompleteExtension = (): Extension => {
  return EditorView.inputHandler.of((targetView, from, to, text) => {
    if (props.readonly || from !== to || text !== '{') {
      return false
    }

    const doc = targetView.state.doc
    const prevChar = from > 0 ? doc.sliceString(from - 1, from) : ''
    const lookahead = doc.sliceString(from, Math.min(doc.length, from + 2))

    if (prevChar === '{') {
      if (lookahead.startsWith('}}')) {
        return false
      }

      const insertText = lookahead.startsWith('}') ? '{}' : '{}}'
      targetView.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + 1 },
        userEvent: 'input',
      })
      return true
    }

    if (prevChar === '$') {
      if (lookahead.startsWith('}')) {
        return false
      }

      targetView.dispatch({
        changes: { from, to, insert: '{}' },
        selection: { anchor: from + 1 },
        userEvent: 'input',
      })
      return true
    }

    return false
  })
}

const resolveCloseToken = (text: string): string => {
  if (text.startsWith('{{')) {
    return '}}'
  }
  if (text.startsWith('${')) {
    return '}'
  }
  return ''
}

const applyEdit = (payload: CodeMirrorExpressionPopupSelectPayload): void => {
  const currentView = view ?? editorRef.value?.getView()
  if (!currentView) {
    return
  }

  const docLength = currentView.state.doc.length
  const fallbackOffset = currentView.state.selection.main.head
  const baseRange = payload.replaceRange ?? popupContext.value?.defaultReplaceRange ?? {
    from: fallbackOffset,
    to: fallbackOffset,
  }
  const range = normalizeRange(baseRange, docLength)

  const closeToken = resolveCloseToken(payload.insertText)
  let overlap = 0
  if (closeToken) {
    const lookahead = currentView.state.doc.sliceString(range.to, Math.min(docLength, range.to + closeToken.length))
    for (let index = closeToken.length; index > 0; index -= 1) {
      if (lookahead.startsWith(closeToken.slice(0, index))) {
        overlap = index
        break
      }
    }
  }

  const targetRange = {
    from: range.from,
    to: clampOffset(range.to + overlap, docLength),
  }
  const cursorOffset = targetRange.from + payload.insertText.length

  suppressNextTrigger.value = true
  currentView.dispatch({
    changes: {
      from: targetRange.from,
      to: targetRange.to,
      insert: payload.insertText,
    },
    selection: {
      anchor: cursorOffset,
    },
    scrollIntoView: true,
  })
  currentView.focus()
}

const handlePopupSelect = (payload: CodeMirrorExpressionPopupSelectPayload): void => {
  emit('popup-select', payload)
  applyEdit(payload)
  hidePopup()
}

const replaceExpressionText = (range: CodeMirrorMdEditorRange, nextValue: string): void => {
  applyEdit({
    insertText: nextValue,
    replaceRange: range,
  })
}

const removeExpressionText = (range: CodeMirrorMdEditorRange): void => {
  applyEdit({
    insertText: '',
    replaceRange: range,
  })
}

const createExpressionRenderingExtension = (): Extension | undefined => {
  const rules = props.expressionRules
  if (!rules.length) {
    return undefined
  }

  class ExpressionReplaceWidget extends WidgetType {
    private readonly ruleKey: string
    private readonly range: CodeMirrorMdEditorRange
    private readonly context: CodeMirrorMdExpressionContext
    private readonly component: NonNullable<CodeMirrorMdExpressionRule['component']>
    private readonly componentProps: Record<string, unknown>
    private readonly block: boolean
    private readonly readonly: boolean

    constructor(
      ruleKey: string,
      range: CodeMirrorMdEditorRange,
      context: CodeMirrorMdExpressionContext,
      component: NonNullable<CodeMirrorMdExpressionRule['component']>,
      componentProps: Record<string, unknown>,
      block: boolean,
      readonly: boolean,
    ) {
      super()
      this.ruleKey = ruleKey
      this.range = range
      this.context = context
      this.component = component
      this.componentProps = componentProps
      this.block = block
      this.readonly = readonly
    }

    eq(other: ExpressionReplaceWidget): boolean {
      return (
        this.ruleKey === other.ruleKey &&
        this.range.from === other.range.from &&
        this.range.to === other.range.to &&
        this.context.raw === other.context.raw &&
        this.readonly === other.readonly
      )
    }

    toDOM(): HTMLElement {
      const dom = document.createElement(this.block ? 'div' : 'span')
      dom.className = `cm-md-editor-replace-widget ${this.block ? 'cm-md-editor-replace-widget-block' : ''}`

      const vueApp = createApp({
        render: () =>
          h(this.component, {
            ...this.componentProps,
            raw: this.context.raw,
            context: this.context,
            readonly: this.readonly,
            onUpdate: (payload: { newText: string }) => {
              replaceExpressionText(this.range, payload.newText)
            },
            onRemove: () => {
              removeExpressionText(this.range)
            },
          }),
      })
      vueApp.mount(dom)
      ;(dom as HTMLElement & { __widgetApp?: ReturnType<typeof createApp> }).__widgetApp = vueApp
      return dom
    }

    destroy(dom: HTMLElement): void {
      ;(dom as HTMLElement & { __widgetApp?: ReturnType<typeof createApp> }).__widgetApp?.unmount()
    }

    ignoreEvent(): boolean {
      return true
    }
  }

  const buildDecorations = (
    targetView: EditorView,
  ): { decorations: DecorationSet; atomicRanges: DecorationSet } => {
    const text = targetView.state.doc.toString()
    const occupiedReplaceRanges: ReplaceRange[] = []
    const entries: Array<{ from: number; to: number; decoration: Decoration }> = []
    const atomicEntries: Array<{ from: number; to: number; decoration: Decoration }> = []

    for (const rule of rules) {
      if (rule.mode === 'none') {
        continue
      }

      const matcher = ensureGlobalRegex(rule.match)
      let match: RegExpExecArray | null
      while ((match = matcher.exec(text)) !== null) {
        const raw = match[0]
        if (!raw) {
          matcher.lastIndex += 1
          continue
        }

        const range = {
          from: match.index,
          to: match.index + raw.length,
        }

        if (range.from >= range.to) {
          continue
        }

        if (rule.mode === 'replace') {
          if (!rule.component || rangesOverlap(range, occupiedReplaceRanges)) {
            continue
          }

          occupiedReplaceRanges.push(range)
          const expressionContext = parseExpressionContext(raw, range)
          const componentProps = rule.componentProps?.(expressionContext) ?? {}
          const replaceDecoration = Decoration.replace({
            block: rule.block === true,
            inclusive: false,
            widget: new ExpressionReplaceWidget(
              rule.key,
              range,
              expressionContext,
              rule.component,
              componentProps,
              rule.block === true,
              props.readonly,
            ),
          })
          entries.push({
            from: range.from,
            to: range.to,
            decoration: replaceDecoration,
          })
          atomicEntries.push({
            from: range.from,
            to: range.to,
            decoration: replaceDecoration,
          })
          continue
        }

        if (rangesOverlap(range, occupiedReplaceRanges)) {
          continue
        }

        entries.push({
          from: range.from,
          to: range.to,
          decoration: Decoration.mark({
            class: getHighlightClassName(rule),
          }),
        })
      }
    }

    entries.sort((left, right) => {
      if (left.from === right.from) {
        return left.to - right.to
      }
      return left.from - right.from
    })
    atomicEntries.sort((left, right) => {
      if (left.from === right.from) {
        return left.to - right.to
      }
      return left.from - right.from
    })

    const builder = new RangeSetBuilder<Decoration>()
    for (const entry of entries) {
      builder.add(entry.from, entry.to, entry.decoration)
    }
    const atomicBuilder = new RangeSetBuilder<Decoration>()
    for (const entry of atomicEntries) {
      atomicBuilder.add(entry.from, entry.to, entry.decoration)
    }
    return {
      decorations: builder.finish(),
      atomicRanges: atomicBuilder.finish(),
    }
  }

  const expressionRenderingPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      atomicRanges: DecorationSet

      constructor(targetView: EditorView) {
        const result = buildDecorations(targetView)
        this.decorations = result.decorations
        this.atomicRanges = result.atomicRanges
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
          const result = buildDecorations(update.view)
          this.decorations = result.decorations
          this.atomicRanges = result.atomicRanges
        }
      }
    },
    {
      decorations: value => value.decorations,
    },
  )

  return [
    expressionRenderingPlugin,
    EditorView.atomicRanges.of(
      view => view.plugin(expressionRenderingPlugin)?.atomicRanges ?? Decoration.none,
    ),
  ]
}

const expressionExtensions = computed<Extension[]>(() => {
  const extensions: Extension[] = [
    createMarkdownAppearanceExtension(),
    createExpressionAutoCompleteExtension(),
    keymap.of([
      {
        key: 'Escape',
        run: () => closePopupByEscape(),
      },
    ]),
  ]

  const renderingExtension = createExpressionRenderingExtension()
  if (renderingExtension) {
    extensions.push(renderingExtension)
  }

  extensions.push(...normalizeExtensions(props.extensions))
  return extensions
})

const updatePopupPosition = (offset: number): void => {
  if (!popupVisible.value) {
    return
  }

  const currentView = view ?? editorRef.value?.getView()
  const root = rootRef.value
  if (!currentView || !root) {
    return
  }

  const coords = currentView.coordsAtPos(offset)
  if (!coords) {
    return
  }

  const rootRect = root.getBoundingClientRect()
  const popupNode = popupContainerRef.value
  const padding = 8

  let left = coords.left - rootRect.left
  const top = coords.bottom - rootRect.top + 6

  if (popupNode) {
    const maxLeft = rootRect.width - popupNode.offsetWidth - padding
    left = Math.min(Math.max(left, padding), Math.max(maxLeft, padding))
  } else {
    left = Math.max(left, padding)
  }

  popupStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

const findTriggerMatch = (): TriggerMatch | null => {
  const currentView = view ?? editorRef.value?.getView()
  if (!currentView || !currentView.hasFocus) {
    return null
  }

  const selection = currentView.state.selection.main
  if (!selection.empty) {
    return null
  }

  const head = selection.head
  const line = currentView.state.doc.lineAt(head)
  const prefix = currentView.state.doc.sliceString(line.from, head)

  for (const pattern of props.triggerPatterns) {
    const normalizedFlags = pattern.flags.replace(/g/g, '')
    const matcher = new RegExp(pattern.source, normalizedFlags)
    const result = matcher.exec(prefix)
    if (!result || typeof result.index !== 'number') {
      continue
    }

    const matchedText = result[0]
    if (!matchedText) {
      continue
    }

    const startOffset = line.from + result.index
    const queryText = prefix.slice(result.index + 2)
    return {
      triggerText: matchedText.slice(0, 2),
      queryText,
      replaceRange: {
        from: startOffset,
        to: head,
      },
      position: {
        offset: head,
        lineNumber: line.number,
        column: head - line.from + 1,
      },
    }
  }

  return null
}

const maybeShowPopup = (): void => {
  if (props.readonly || !props.popupComponent) {
    hidePopup()
    return
  }

  if (suppressNextTrigger.value) {
    suppressNextTrigger.value = false
    hidePopup()
    return
  }

  const match = findTriggerMatch()
  if (!match) {
    hidePopup()
    return
  }

  const context: CodeMirrorExpressionPopupContext = {
    triggerText: match.triggerText,
    queryText: match.queryText,
    defaultReplaceRange: match.replaceRange,
    position: match.position,
  }

  popupContext.value = context
  popupVisible.value = true
  emit('popup-show', context)
  nextTick(() => {
    updatePopupPosition(match.position.offset)
  })
}

const handleEditorReady = (payload: CodeMirrorEditorReadyPayload): void => {
  view = payload.view
  emit('ready', payload)
}

const handleViewUpdate = (payload: CodeMirrorEditorViewUpdate): void => {
  view = payload.view
  emit('view-update', payload)

  if (popupVisible.value && popupContext.value) {
    updatePopupPosition(popupContext.value.position.offset)
  }

  if (payload.docChanged || payload.selectionSet) {
    maybeShowPopup()
    return
  }

  if (payload.focusChanged && payload.view.hasFocus) {
    maybeShowPopup()
  }
}

const handleEditorBlur = (): void => {
  emit('blur')
  window.setTimeout(() => {
    if (!popupVisible.value) {
      return
    }
    if (pointerDownInsidePopup) {
      return
    }
    const activeElement = document.activeElement
    if (activeElement && popupContainerRef.value?.contains(activeElement)) {
      return
    }
    hidePopup()
  }, 0)
}

const markPopupInteraction = (): void => {
  pointerDownInsidePopup = true
  window.setTimeout(() => {
    pointerDownInsidePopup = false
  }, 180)
}

const handleWindowPointerDown = (event: PointerEvent): void => {
  if (!popupVisible.value) {
    return
  }

  const target = event.target as Node | null
  if (!target) {
    return
  }

  const popupNode = popupContainerRef.value
  const rootNode = rootRef.value
  if (popupNode?.contains(target) || rootNode?.contains(target)) {
    return
  }

  hidePopup()
}

watch(
  () => props.expressionRules,
  () => {
    updateRuleStyles()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.readonly,
  readonly => {
    if (readonly) {
      hidePopup()
      return
    }
    maybeShowPopup()
  },
)

watch(
  () => props.popupComponent,
  value => {
    if (!value) {
      hidePopup()
      return
    }
    maybeShowPopup()
  },
)

watch(
  () => props.triggerPatterns,
  () => {
    maybeShowPopup()
  },
  { deep: true },
)

onMounted(() => {
  window.addEventListener('pointerdown', handleWindowPointerDown, true)
})

onBeforeUnmount(() => {
  removeStyleElement()
  window.removeEventListener('pointerdown', handleWindowPointerDown, true)
  hidePopup()
  view = undefined
})

defineExpose<CodeMirrorMdEditorExpose>({
  focus: () => editorRef.value?.focus(),
  blur: () => editorRef.value?.blur(),
  getView: () => view ?? editorRef.value?.getView(),
  insertText: (text, range) => {
    handlePopupSelect({
      insertText: text,
      replaceRange: range,
    })
  },
  hidePopup,
})
</script>

<template>
  <div ref="rootRef" class="codemirror-md-editor-root">
    <CodeMirrorEditor
      ref="editorRef"
      :model-value="modelValue"
      language="markdown"
      :theme="theme"
      :width="width"
      :height="height"
      :placeholder="placeholder"
      :font-size="fontSize"
      :line-numbers="lineNumbers"
      :line-wrapping="lineWrapping"
      :readonly="readonly"
      :autofocus="autofocus"
      :extensions="expressionExtensions"
      @update:model-value="emit('update:modelValue', $event)"
      @ready="handleEditorReady"
      @change="emit('change', $event)"
      @focus="emit('focus')"
      @blur="handleEditorBlur"
      @view-update="handleViewUpdate"
      @error="emit('error', $event)"
    />

    <div
      v-if="popupVisible && popupComponent"
      ref="popupContainerRef"
      class="codemirror-md-editor-popup"
      :style="popupStyle"
      @pointerdown.capture="markPopupInteraction"
      @mousedown.stop
      @click.stop
    >
      <component
        :is="popupComponent"
        v-bind="popupProps ?? {}"
        :context="popupContext"
        @select="handlePopupSelect"
        @close="hidePopup"
      />
    </div>
  </div>
</template>

<style scoped>
.codemirror-md-editor-root {
  position: relative;
  width: 100%;
}

.codemirror-md-editor-popup {
  position: absolute;
  z-index: 100;
  min-width: 220px;
  pointer-events: auto;
}

:global(.cm-md-editor-replace-widget) {
  display: inline-flex;
  align-items: center;
}

:global(.cm-md-editor-replace-widget-block) {
  display: block;
  width: 100%;
  margin: 4px 0;
}
</style>
