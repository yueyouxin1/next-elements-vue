<script setup lang="ts">
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorSelection, EditorState, type Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
  lineNumbers as cmLineNumbers,
  placeholder as cmPlaceholder,
  type ViewUpdate,
} from '@codemirror/view'
import {
  createApp,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Component,
} from 'vue'
import { createExpressionRenderingExtension } from './composables/use-expression-rendering'
import {
  DEFAULT_TRIGGER_PATTERNS,
  findTriggerMatch,
  positionPopupElement,
  resolvePopupInsertRange,
} from './composables/use-expression-popup'
import type {
  CodeMirrorMdEditorExpose,
  CodeMirrorMdEditorProps,
  CodeMirrorRange,
  ExpressionPopupContext,
  ExpressionPopupSelectPayload,
} from './types'

const props = withDefaults(defineProps<CodeMirrorMdEditorProps>(), {
  theme: 'vs-light',
  width: '100%',
  height: '320px',
  placeholder: '',
  fontSize: 13,
  lineNumbers: true,
  readonly: false,
  autofocus: false,
  triggerPatterns: () => [...DEFAULT_TRIGGER_PATTERNS],
  popupComponent: undefined,
  popupProps: undefined,
  expressionRules: () => [],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { view: EditorView }): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'error', error: unknown): void
  (e: 'popup-show', payload: ExpressionPopupContext): void
  (e: 'popup-hide'): void
  (e: 'popup-select', payload: ExpressionPopupSelectPayload): void
}>()

const rootRef = ref<HTMLElement>()
const editorHostRef = ref<HTMLElement>()
const popupVisible = ref(false)

const popupState = reactive<{
  context: ExpressionPopupContext | undefined
  component: Component | undefined
  popupProps: Record<string, unknown>
}>({
  context: undefined,
  component: props.popupComponent,
  popupProps: props.popupProps ?? {},
})

const normalizeSize = (size: number | string): string => {
  if (typeof size === 'number') {
    return `${size}px`
  }
  return size
}

const rootStyle = () => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height),
})

const isDarkTheme = (theme: string): boolean => theme.toLowerCase().includes('dark')

const lineNumberEnabled = (): boolean => props.lineNumbers === true || props.lineNumbers === 'on'

const editableCompartment = new Compartment()
const lineNumberCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()
const expressionCompartment = new Compartment()

let view: EditorView | undefined
let suppressModelEmit = false
let suppressNextTrigger = false
let popupContainer: HTMLDivElement | undefined
let popupApp: ReturnType<typeof createApp> | undefined
let pointerDownInsidePopup = false
let outsidePointerListener: ((event: PointerEvent) => void) | undefined

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
  if (pointerDownInsidePopup) {
    return true
  }
  const activeElement = document.activeElement
  if (!activeElement || !popupContainer) {
    return false
  }
  return popupContainer.contains(activeElement)
}

const ensurePopupContainer = (): void => {
  if (popupContainer || !rootRef.value) {
    return
  }

  popupContainer = document.createElement('div')
  popupContainer.className = 'codemirror-md-editor-popup'
  popupContainer.style.display = 'none'
  popupContainer.addEventListener('mousedown', stopMouseEvent)
  popupContainer.addEventListener('click', stopMouseEvent)
  popupContainer.addEventListener('pointerdown', markPopupInteraction, true)
  rootRef.value.appendChild(popupContainer)
}

const detachPopupApp = (): void => {
  popupApp?.unmount()
  popupApp = undefined
}

const refreshPopupPosition = (): void => {
  if (!view || !popupVisible.value || !popupContainer || !popupState.context || !rootRef.value) {
    return
  }

  positionPopupElement(
    view,
    popupState.context.defaultReplaceRange.to,
    popupContainer,
    rootRef.value,
  )
}

function hidePopup(shouldEmit = true): void {
  popupState.context = undefined
  if (!popupVisible.value) {
    return
  }
  popupVisible.value = false
  if (popupContainer) {
    popupContainer.style.display = 'none'
  }
  if (shouldEmit) {
    emit('popup-hide')
  }
}

const attachPopupApp = (): void => {
  if (!popupContainer || popupApp) {
    return
  }

  popupApp = createApp({
    setup: () =>
      () =>
        popupState.component
          ? h(popupState.component, {
              ...(popupState.popupProps ?? {}),
              context: popupState.context,
              onSelect: (payload: ExpressionPopupSelectPayload) => handlePopupSelect(payload),
              onClose: () => hidePopup(),
            })
          : null,
  })
  popupApp.mount(popupContainer)
}

const destroyPopupContainer = (): void => {
  if (!popupContainer) {
    return
  }

  popupContainer.removeEventListener('mousedown', stopMouseEvent)
  popupContainer.removeEventListener('click', stopMouseEvent)
  popupContainer.removeEventListener('pointerdown', markPopupInteraction, true)
  popupContainer.remove()
  popupContainer = undefined
}

const syncPopupComponent = (): void => {
  popupState.component = props.popupComponent
  popupState.popupProps = props.popupProps ?? {}
}

const showPopup = (context: ExpressionPopupContext): void => {
  if (!popupContainer || !popupState.component || props.readonly) {
    hidePopup()
    return
  }

  const wasVisible = popupVisible.value
  popupVisible.value = true
  popupState.context = context
  popupContainer.style.display = 'block'
  attachPopupApp()
  refreshPopupPosition()
  nextTick(() => {
    refreshPopupPosition()
  })

  if (!wasVisible) {
    emit('popup-show', context)
  }
}

const syncPopupFromCursor = (): void => {
  if (!view || !popupContainer) {
    return
  }

  if (props.readonly || !popupState.component) {
    hidePopup()
    return
  }

  if (suppressNextTrigger) {
    suppressNextTrigger = false
    hidePopup()
    return
  }

  const match = findTriggerMatch(view, props.triggerPatterns)
  if (!match) {
    hidePopup()
    return
  }

  showPopup(match)
}

const applyPopupInsert = (payload: ExpressionPopupSelectPayload): void => {
  if (!view || props.readonly) {
    return
  }

  const cursor = view.state.selection.main.head
  const fallbackRange: CodeMirrorRange = popupState.context?.defaultReplaceRange ?? {
    from: cursor,
    to: cursor,
  }

  const insertRange = resolvePopupInsertRange(view, payload, fallbackRange)
  suppressNextTrigger = true
  view.dispatch({
    changes: {
      from: insertRange.from,
      to: insertRange.to,
      insert: payload.insertText,
    },
    selection: EditorSelection.cursor(insertRange.from + payload.insertText.length),
    scrollIntoView: true,
  })
  view.focus()
}

function handlePopupSelect(payload: ExpressionPopupSelectPayload): void {
  emit('popup-select', payload)
  applyPopupInsert(payload)
  hidePopup()
}

const applyReplaceEdit = (payload: { from: number; to: number; newText: string }): void => {
  if (!view || props.readonly) {
    return
  }

  suppressNextTrigger = true
  view.dispatch({
    changes: {
      from: payload.from,
      to: payload.to,
      insert: payload.newText,
    },
    selection: EditorSelection.cursor(payload.from + payload.newText.length),
    scrollIntoView: true,
  })
  view.focus()
}

const resolveEditableExtension = (): Extension => [
  EditorState.readOnly.of(props.readonly),
  EditorView.editable.of(!props.readonly),
]

const resolveLineNumberExtension = (): Extension => (lineNumberEnabled() ? cmLineNumbers() : [])

const resolvePlaceholderExtension = (): Extension =>
  props.placeholder ? cmPlaceholder(props.placeholder) : []

const resolveThemeExtension = (): Extension => {
  const dark = isDarkTheme(props.theme)
  const baseTheme = EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: `${props.fontSize}px`,
      },
      '.cm-scroller': {
        overflow: 'auto',
        lineHeight: '1.6',
      },
      '.cm-content': {
        minHeight: '100%',
        padding: '10px 0',
      },
      '.cm-line': {
        padding: '0 12px',
      },
      '.cm-gutters': {
        borderRight: dark ? '1px solid #334155' : '1px solid #e2e8f0',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
    },
    { dark },
  )

  return dark ? [oneDark, baseTheme] : baseTheme
}

const resolveExpressionExtension = (): Extension =>
  createExpressionRenderingExtension({
    rules: props.expressionRules,
    onApplyEdit: applyReplaceEdit,
  })

const handleViewUpdate = (update: ViewUpdate): void => {
  if (update.docChanged && !suppressModelEmit) {
    const nextValue = update.state.doc.toString()
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
  }

  if (update.focusChanged) {
    if (update.view.hasFocus) {
      emit('focus')
    } else {
      emit('blur')
      window.setTimeout(() => {
        if (shouldKeepPopupOnBlur()) {
          return
        }
        hidePopup()
      }, 0)
    }
  }

  if (update.docChanged || update.selectionSet || update.viewportChanged) {
    syncPopupFromCursor()
    refreshPopupPosition()
  }
}

const createEditor = (): void => {
  if (!editorHostRef.value) {
    return
  }

  try {
    const state = EditorState.create({
      doc: props.modelValue,
      extensions: [
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        history(),
        markdown(),
        drawSelection(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        EditorView.updateListener.of(handleViewUpdate),
        editableCompartment.of(resolveEditableExtension()),
        lineNumberCompartment.of(resolveLineNumberExtension()),
        placeholderCompartment.of(resolvePlaceholderExtension()),
        themeCompartment.of(resolveThemeExtension()),
        expressionCompartment.of(resolveExpressionExtension()),
      ],
    })

    view = new EditorView({
      state,
      parent: editorHostRef.value,
    })

    if (props.autofocus) {
      view.focus()
    }

    emit('ready', { view })
    syncPopupFromCursor()
  } catch (error) {
    emit('error', error)
  }
}

const bindOutsidePointerListener = (): void => {
  if (outsidePointerListener) {
    return
  }

  outsidePointerListener = (event: PointerEvent) => {
    if (!popupVisible.value || !rootRef.value) {
      return
    }
    const target = event.target as Node | null
    if (!target) {
      return
    }
    if (rootRef.value.contains(target)) {
      return
    }
    hidePopup()
  }

  window.addEventListener('pointerdown', outsidePointerListener, true)
}

const unbindOutsidePointerListener = (): void => {
  if (!outsidePointerListener) {
    return
  }
  window.removeEventListener('pointerdown', outsidePointerListener, true)
  outsidePointerListener = undefined
}

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!view) {
      return
    }

    const currentValue = view.state.doc.toString()
    if (currentValue === nextValue) {
      return
    }

    suppressModelEmit = true
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: nextValue,
      },
    })
    suppressModelEmit = false
  },
)

watch(
  () => props.readonly,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: editableCompartment.reconfigure(resolveEditableExtension()),
    })
    if (props.readonly) {
      hidePopup()
    }
  },
)

watch(
  () => props.lineNumbers,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: lineNumberCompartment.reconfigure(resolveLineNumberExtension()),
    })
  },
)

watch(
  () => props.placeholder,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: placeholderCompartment.reconfigure(resolvePlaceholderExtension()),
    })
  },
)

watch(
  [() => props.theme, () => props.fontSize],
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: themeCompartment.reconfigure(resolveThemeExtension()),
    })
  },
)

watch(
  () => props.expressionRules,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: expressionCompartment.reconfigure(resolveExpressionExtension()),
    })
  },
  { deep: true },
)

watch(
  () => props.popupComponent,
  (component) => {
    popupState.component = component
    if (!component) {
      hidePopup()
      return
    }
    if (popupVisible.value) {
      attachPopupApp()
      nextTick(() => {
        refreshPopupPosition()
      })
    }
  },
)

watch(
  () => props.popupProps,
  () => {
    popupState.popupProps = props.popupProps ?? {}
    if (popupVisible.value) {
      nextTick(() => {
        refreshPopupPosition()
      })
    }
  },
  { deep: true },
)

watch(
  () => props.triggerPatterns,
  () => {
    syncPopupFromCursor()
  },
  { deep: true },
)

onMounted(() => {
  syncPopupComponent()
  ensurePopupContainer()
  bindOutsidePointerListener()
  createEditor()
})

onBeforeUnmount(() => {
  hidePopup(false)
  unbindOutsidePointerListener()
  detachPopupApp()
  destroyPopupContainer()
  view?.destroy()
  view = undefined
})

defineExpose<CodeMirrorMdEditorExpose>({
  focus: () => view?.focus(),
  blur: () => view?.contentDOM.blur(),
  getView: () => view,
  insertText: (text, range) => {
    handlePopupSelect({
      insertText: text,
      replaceRange: range,
    })
  },
  hidePopup: () => hidePopup(),
})
</script>

<template>
  <div ref="rootRef" class="codemirror-md-editor-root" :style="rootStyle()">
    <div ref="editorHostRef" class="codemirror-md-editor-container" />
  </div>
</template>

<style scoped>
.codemirror-md-editor-root {
  position: relative;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.codemirror-md-editor-container {
  width: 100%;
  height: 100%;
}

:global(.codemirror-md-editor-popup) {
  position: absolute;
  z-index: 90;
  min-width: 220px;
  pointer-events: auto;
}
</style>

