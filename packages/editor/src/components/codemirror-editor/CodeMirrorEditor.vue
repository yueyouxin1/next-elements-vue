<script setup lang="ts">
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  CodeMirrorEditorExpose,
  CodeMirrorEditorExtensions,
  CodeMirrorEditorLanguage,
  CodeMirrorEditorProps,
  CodeMirrorEditorReadyPayload,
} from './types'

const props = withDefaults(defineProps<CodeMirrorEditorProps>(), {
  theme: 'vs-light',
  width: '100%',
  height: '320px',
  placeholder: '',
  fontSize: 13,
  lineNumbers: true,
  lineWrapping: false,
  readonly: false,
  autofocus: false,
  language: 'json',
  extensions: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: CodeMirrorEditorReadyPayload): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'view-update', payload: ViewUpdate): void
  (e: 'error', error: unknown): void
}>()

const rootRef = ref<HTMLElement>()
const editorHostRef = ref<HTMLElement>()

const editableCompartment = new Compartment()
const lineNumberCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const themeCompartment = new Compartment()
const lineWrappingCompartment = new Compartment()
const languageCompartment = new Compartment()
const extensionsCompartment = new Compartment()

let view: EditorView | undefined
let suppressModelEmit = false

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

const normalizeExtensions = (input: CodeMirrorEditorExtensions | undefined): Extension[] => {
  if (!input) {
    return []
  }
  return Array.isArray(input) ? input : [input]
}

const languageExtensionMap: Record<CodeMirrorEditorLanguage, Extension> = {
  typescript: javascript({ typescript: true }),
  javascript: javascript(),
  json: json(),
  html: html(),
  css: css(),
  markdown: markdown(),
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

const resolveLineWrappingExtension = (): Extension => (props.lineWrapping ? EditorView.lineWrapping : [])

const resolveLanguageExtension = (): Extension => {
  if (!props.language) {
    return []
  }

  if (typeof props.language === 'string') {
    return languageExtensionMap[props.language]
  }

  return normalizeExtensions(props.language)
}

const resolveExternalExtensions = (): Extension => normalizeExtensions(props.extensions)

const handleViewUpdate = (update: ViewUpdate): void => {
  emit('view-update', update)

  if (update.docChanged && !suppressModelEmit) {
    const nextValue = update.state.doc.toString()
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
  }

  if (!update.focusChanged) {
    return
  }

  if (update.view.hasFocus) {
    emit('focus')
    return
  }

  emit('blur')
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
        drawSelection(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.updateListener.of(handleViewUpdate),
        editableCompartment.of(resolveEditableExtension()),
        lineNumberCompartment.of(resolveLineNumberExtension()),
        placeholderCompartment.of(resolvePlaceholderExtension()),
        themeCompartment.of(resolveThemeExtension()),
        lineWrappingCompartment.of(resolveLineWrappingExtension()),
        languageCompartment.of(resolveLanguageExtension()),
        extensionsCompartment.of(resolveExternalExtensions()),
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
  } catch (error) {
    emit('error', error)
  }
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
  () => props.lineWrapping,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: lineWrappingCompartment.reconfigure(resolveLineWrappingExtension()),
    })
  },
)

watch(
  () => props.language,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: languageCompartment.reconfigure(resolveLanguageExtension()),
    })
  },
  { deep: true },
)

watch(
  () => props.extensions,
  () => {
    if (!view) {
      return
    }
    view.dispatch({
      effects: extensionsCompartment.reconfigure(resolveExternalExtensions()),
    })
  },
  { deep: true },
)

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  view?.destroy()
  view = undefined
})

defineExpose<CodeMirrorEditorExpose>({
  focus: () => view?.focus(),
  blur: () => view?.contentDOM.blur(),
  getView: () => view,
})
</script>

<template>
  <div ref="rootRef" class="codemirror-editor-root" :style="rootStyle()">
    <div ref="editorHostRef" class="codemirror-editor-container" />
  </div>
</template>

<style scoped>
.codemirror-editor-root {
  position: relative;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.codemirror-editor-container {
  width: 100%;
  height: 100%;
}
</style>
