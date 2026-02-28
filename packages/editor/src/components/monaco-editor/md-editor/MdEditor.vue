<script setup lang="ts">
import { createApp, h, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Component } from 'vue'
import type * as monaco from 'monaco-editor'
import MonacoEditor from '../MonacoEditor.vue'
import type { MonacoEditorExpose } from '../types'
import type {
  ExpressionPopupContext,
  ExpressionPopupSelectPayload,
  MdEditorExpose,
  MdEditorProps,
} from './types'

type TriggerMatch = {
  triggerText: string
  queryText: string
  defaultReplaceRange: monaco.IRange
  position: monaco.IPosition
}

type PopupWidget = monaco.editor.IContentWidget & {
  setPosition: (position: monaco.IPosition) => void
  setVisible: (visible: boolean) => void
  getVisible: () => boolean
  getDomNodeRef: () => HTMLElement
}

const props = withDefaults(defineProps<MdEditorProps>(), {
  theme: 'vs-dark',
  width: '100%',
  height: '320px',
  placeholder: '',
  wordWrap: 'on',
  fontSize: 13,
  minimap: false,
  lineNumbers: 'on',
  readonly: false,
  autofocus: false,
  options: undefined,
  triggerPatterns: () => [/\{\{[^}\n]*$/, /\$\{[^}\n]*$/],
  popupComponent: undefined,
  popupProps: undefined,
  expressionRules: () => [],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { editor: monaco.editor.IStandaloneCodeEditor; monaco: typeof monaco }): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'validate', markers: monaco.editor.IMarker[]): void
  (e: 'error', error: unknown): void
  (e: 'popup-show', payload: ExpressionPopupContext): void
  (e: 'popup-hide'): void
  (e: 'popup-select', payload: ExpressionPopupSelectPayload): void
}>()

const monacoEditorRef = ref<MonacoEditorExpose>()
const editorReady = ref(false)

let editor: monaco.editor.IStandaloneCodeEditor | undefined
let monacoApi: typeof monaco | undefined
let popupWidget: PopupWidget | undefined
let popupApp: ReturnType<typeof createApp> | undefined
let popupVisible = false
let suppressNextTrigger = false
let currentContext: ExpressionPopupContext | undefined
let keydownListener: monaco.IDisposable | undefined
let blurListener: monaco.IDisposable | undefined
let cursorListener: monaco.IDisposable | undefined
let contentListener: monaco.IDisposable | undefined
let outsideClickListener: ((event: PointerEvent) => void) | undefined
let pointerDownInsidePopup = false
let highlightDecorationIds: string[] = []
let styleElement: HTMLStyleElement | undefined

const stopMouseEvent = (event: Event): void => {
  event.stopPropagation()
}

const markPopupInteraction = (): void => {
  pointerDownInsidePopup = true
  window.setTimeout(() => {
    pointerDownInsidePopup = false
  }, 0)
}

const shouldKeepPopupOnBlur = (): boolean => {
  if (pointerDownInsidePopup || !popupWidget) {
    return pointerDownInsidePopup
  }

  const activeElement = document.activeElement
  if (!activeElement) {
    return false
  }

  return popupWidget.getDomNodeRef().contains(activeElement)
}

const toSafeClassToken = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-')

const ensureGlobalRegex = (pattern: RegExp): RegExp => {
  if (pattern.flags.includes('g')) {
    return new RegExp(pattern.source, pattern.flags)
  }
  return new RegExp(pattern.source, `${pattern.flags}g`)
}

const createHighlightDecoration = (
  range: monaco.IRange,
  className: string,
): monaco.editor.IModelDeltaDecoration => ({
  range,
  options: {
    inlineClassName: className,
  },
})

const updateRuleStyles = (): void => {
  const css: string[] = []

  for (const rule of props.expressionRules) {
    if (rule.mode !== 'highlight' || !rule.highlightStyle) {
      continue
    }

    const className = `md-editor-highlight-${toSafeClassToken(rule.key)}`
    const borderRadius = rule.highlightStyle.borderRadius ?? '4px'
    css.push(`.${className}{background:${rule.highlightStyle.backgroundColor};border-radius:${borderRadius};}`)
  }

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-md-editor-expression-styles', 'true')
    document.head.appendChild(styleElement)
  }
  styleElement.textContent = css.join('\n')
}

const removeStyleElement = (): void => {
  styleElement?.remove()
  styleElement = undefined
}

const clearHighlightDecorations = (): void => {
  if (!editor || !highlightDecorationIds.length) {
    return
  }
  highlightDecorationIds = editor.deltaDecorations(highlightDecorationIds, [])
}

const scanHighlightDecorations = (): monaco.editor.IModelDeltaDecoration[] => {
  const model = editor?.getModel()
  if (!model) {
    return []
  }

  const text = model.getValue()
  const decorations: monaco.editor.IModelDeltaDecoration[] = []

  for (const rule of props.expressionRules) {
    if (rule.mode !== 'highlight') {
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

      const startOffset = match.index
      const endOffset = startOffset + raw.length
      const start = model.getPositionAt(startOffset)
      const end = model.getPositionAt(endOffset)
      const className = `md-editor-highlight-${toSafeClassToken(rule.key)}`

      decorations.push(
        createHighlightDecoration(
          {
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
          },
          className,
        ),
      )
    }
  }

  return decorations
}

const renderExpressionRules = (): void => {
  if (!editor) {
    return
  }

  updateRuleStyles()
  const highlightDecorations = scanHighlightDecorations()
  highlightDecorationIds = editor.deltaDecorations(highlightDecorationIds, highlightDecorations)
}

const createPopupWidget = (): PopupWidget => {
  const domNode = document.createElement('div')
  domNode.className = 'md-editor-expression-popup'
  domNode.style.display = 'none'
  domNode.addEventListener('mousedown', stopMouseEvent)
  domNode.addEventListener('click', stopMouseEvent)
  domNode.addEventListener('pointerdown', markPopupInteraction, true)

  let position: monaco.IPosition = { lineNumber: 1, column: 1 }
  let visible = false

  return {
    getId: () => 'md-editor-expression-widget',
    getDomNode: () => domNode,
    getPosition: () => ({
      position,
      preference: [
        monacoApi?.editor.ContentWidgetPositionPreference.BELOW,
        monacoApi?.editor.ContentWidgetPositionPreference.ABOVE,
      ].filter(Boolean) as monaco.editor.ContentWidgetPositionPreference[],
    }),
    setPosition: (nextPosition: monaco.IPosition) => {
      position = nextPosition
    },
    setVisible: (nextVisible: boolean) => {
      visible = nextVisible
      domNode.style.display = nextVisible ? 'block' : 'none'
    },
    getVisible: () => visible,
    getDomNodeRef: () => domNode,
  }
}

const attachPopupApp = (): void => {
  if (!popupWidget || !props.popupComponent) {
    return
  }

  popupApp?.unmount()
  popupApp = createApp({
    setup: () => () =>
      h(props.popupComponent as Component, {
        ...(props.popupProps ?? {}),
        context: currentContext,
        onSelect: (payload: ExpressionPopupSelectPayload) => {
          handlePopupSelect(payload)
        },
        onClose: () => {
          hidePopup()
        },
      }),
  })
  popupApp.mount(popupWidget.getDomNodeRef())
}

const destroyPopupApp = (): void => {
  popupApp?.unmount()
  popupApp = undefined
}

const closePopupByEscape = (event: monaco.IKeyboardEvent): void => {
  if (!popupVisible) {
    return
  }

  if (event.code !== 'Escape') {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  hidePopup()
}

const hidePopup = (): void => {
  if (!editor || !popupWidget || !popupVisible) {
    return
  }

  popupVisible = false
  currentContext = undefined
  popupWidget.setVisible(false)
  editor.layoutContentWidget(popupWidget)
  emit('popup-hide')
}

const isMouseOutsidePopupAndEditor = (event: PointerEvent): boolean => {
  const target = event.target as Node | null
  if (!target || !editor || !popupWidget) {
    return false
  }

  const popupNode = popupWidget.getDomNodeRef()
  const editorNode = editor.getDomNode()
  if (!editorNode) {
    return false
  }

  return !popupNode.contains(target) && !editorNode.contains(target)
}

const findTriggerMatch = (): TriggerMatch | null => {
  const model = editor?.getModel()
  const position = editor?.getPosition()
  if (!model || !position) {
    return null
  }

  const prefix = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  })

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

    const triggerStartColumn = result.index + 1
    const queryText = prefix.slice(triggerStartColumn - 1 + 2)

    return {
      triggerText: matchedText.slice(0, 2),
      queryText,
      defaultReplaceRange: {
        startLineNumber: position.lineNumber,
        startColumn: triggerStartColumn,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      position,
    }
  }

  return null
}

const maybeShowPopup = (): void => {
  if (!editor || !popupWidget || props.readonly || !props.popupComponent) {
    hidePopup()
    return
  }

  if (suppressNextTrigger) {
    suppressNextTrigger = false
    hidePopup()
    return
  }

  const match = findTriggerMatch()
  if (!match) {
    hidePopup()
    return
  }

  currentContext = {
    position: match.position,
    triggerText: match.triggerText,
    queryText: match.queryText,
    defaultReplaceRange: match.defaultReplaceRange,
  }

  attachPopupApp()

  popupVisible = true
  popupWidget.setPosition(match.position)
  popupWidget.setVisible(true)
  editor.layoutContentWidget(popupWidget)
  emit('popup-show', currentContext)
}

const applyEdit = (payload: ExpressionPopupSelectPayload): void => {
  const targetEditor = editor
  const model = targetEditor?.getModel()
  if (!targetEditor || !model) {
    return
  }

  const fallbackPosition = targetEditor.getPosition()
  if (!fallbackPosition) {
    return
  }

  const range = payload.replaceRange ?? currentContext?.defaultReplaceRange ?? {
    startLineNumber: fallbackPosition.lineNumber,
    startColumn: fallbackPosition.column,
    endLineNumber: fallbackPosition.lineNumber,
    endColumn: fallbackPosition.column,
  }

  const closeToken = payload.insertText.startsWith('{{')
    ? '}}'
    : payload.insertText.startsWith('${')
      ? '}'
      : ''

  let normalizedRange: monaco.IRange = { ...range }
  if (closeToken) {
    const lookahead = model.getValueInRange({
      startLineNumber: normalizedRange.endLineNumber,
      startColumn: normalizedRange.endColumn,
      endLineNumber: normalizedRange.endLineNumber,
      endColumn: normalizedRange.endColumn + closeToken.length,
    })

    let overlap = 0
    for (let i = closeToken.length; i > 0; i -= 1) {
      if (lookahead.startsWith(closeToken.slice(0, i))) {
        overlap = i
        break
      }
    }

    if (overlap > 0) {
      normalizedRange = {
        ...normalizedRange,
        endColumn: normalizedRange.endColumn + overlap,
      }
    }
  }

  suppressNextTrigger = true
  targetEditor.executeEdits('md-editor-expression-popup', [
    {
      range: normalizedRange,
      text: payload.insertText,
      forceMoveMarkers: true,
    },
  ])
  targetEditor.focus()
}

const handlePopupSelect = (payload: ExpressionPopupSelectPayload): void => {
  emit('popup-select', payload)
  applyEdit(payload)
  hidePopup()
}

const bindPopupLifecycle = (): void => {
  if (!editor || !monacoApi || popupWidget) {
    return
  }

  popupWidget = createPopupWidget()
  editor.addContentWidget(popupWidget)

  keydownListener = editor.onKeyDown(closePopupByEscape)
  blurListener = editor.onDidBlurEditorText(() => {
    window.setTimeout(() => {
      if (shouldKeepPopupOnBlur()) {
        return
      }
      hidePopup()
    }, 0)
  })
  cursorListener = editor.onDidChangeCursorPosition(() => {
    maybeShowPopup()
  })
  contentListener = editor.onDidChangeModelContent(() => {
    renderExpressionRules()
    maybeShowPopup()
  })

  outsideClickListener = (event: PointerEvent) => {
    if (!popupVisible) {
      return
    }
    if (isMouseOutsidePopupAndEditor(event)) {
      hidePopup()
    }
  }
  window.addEventListener('pointerdown', outsideClickListener, true)
}

const cleanupPopupLifecycle = (): void => {
  keydownListener?.dispose()
  blurListener?.dispose()
  cursorListener?.dispose()
  contentListener?.dispose()
  keydownListener = undefined
  blurListener = undefined
  cursorListener = undefined
  contentListener = undefined

  if (outsideClickListener) {
    window.removeEventListener('pointerdown', outsideClickListener, true)
    outsideClickListener = undefined
  }

  if (editor && popupWidget) {
    editor.removeContentWidget(popupWidget)
  }

  popupWidget?.getDomNodeRef().removeEventListener('mousedown', stopMouseEvent)
  popupWidget?.getDomNodeRef().removeEventListener('click', stopMouseEvent)
  popupWidget?.getDomNodeRef().removeEventListener('pointerdown', markPopupInteraction, true)
  popupWidget = undefined
  popupVisible = false
  currentContext = undefined
  destroyPopupApp()
}

const cleanupExpressionRenderer = (): void => {
  clearHighlightDecorations()
  removeStyleElement()
}

const onEditorReady = (payload: {
  editor: monaco.editor.IStandaloneCodeEditor
  monaco: typeof monaco
}): void => {
  editor = payload.editor
  monacoApi = payload.monaco
  editorReady.value = true
  bindPopupLifecycle()
  renderExpressionRules()
  emit('ready', payload)
}

watch(
  () => props.popupComponent,
  () => {
    if (!editorReady.value) {
      return
    }

    if (!props.popupComponent) {
      hidePopup()
      destroyPopupApp()
      return
    }

    if (popupVisible) {
      attachPopupApp()
      nextTick(() => {
        if (popupWidget) {
          editor?.layoutContentWidget(popupWidget)
        }
      })
    }
  },
)

watch(
  () => props.popupProps,
  () => {
    if (popupVisible) {
      attachPopupApp()
    }
  },
  { deep: true },
)

watch(
  () => props.triggerPatterns,
  () => {
    maybeShowPopup()
  },
  { deep: true },
)

watch(
  () => props.expressionRules,
  () => {
    renderExpressionRules()
  },
  { deep: true },
)

watch(
  () => props.readonly,
  (readonly) => {
    if (readonly) {
      hidePopup()
    }
  },
)

onBeforeUnmount(() => {
  cleanupPopupLifecycle()
  cleanupExpressionRenderer()
})

defineExpose<MdEditorExpose>({
  focus: () => monacoEditorRef.value?.focus(),
  blur: () => monacoEditorRef.value?.blur(),
  formatDocument: async () => {
    await monacoEditorRef.value?.formatDocument()
  },
  getEditor: () => monacoEditorRef.value?.getEditor(),
  getModel: () => monacoEditorRef.value?.getModel(),
  insertText: (text, range) => {
    handlePopupSelect({ insertText: text, replaceRange: range })
  },
  hidePopup,
})
</script>

<template>
  <MonacoEditor
    ref="monacoEditorRef"
    :model-value="modelValue"
    language="markdown"
    :path="path"
    :theme="theme"
    :width="width"
    :height="height"
    :placeholder="placeholder"
    :word-wrap="wordWrap"
    :font-size="fontSize"
    :minimap="minimap"
    :line-numbers="lineNumbers"
    :options="options"
    :readonly="readonly"
    :autofocus="autofocus"
    @update:model-value="emit('update:modelValue', $event)"
    @ready="onEditorReady"
    @change="emit('change', $event)"
    @focus="emit('focus')"
    @blur="emit('blur')"
    @validate="emit('validate', $event)"
    @error="emit('error', $event)"
  />
</template>

<style scoped>
:global(.md-editor-expression-popup) {
  position: absolute;
  z-index: 90;
  min-width: 220px;
  pointer-events: auto;
}
</style>
