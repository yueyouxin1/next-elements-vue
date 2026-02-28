<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type * as monaco from 'monaco-editor'
import { acquireModel, type AcquiredModel } from './model-pool'
import { setupMonaco } from './monaco-setup'
import type { MonacoEditorExpose, MonacoEditorProps } from './types'

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  language: 'json',
  theme: 'vs-dark',
  width: '100%',
  height: '320px',
  placeholder: '',
  wordWrap: 'off',
  fontSize: 13,
  minimap: false,
  lineNumbers: 'on',
  readonly: false,
  autofocus: false,
  options: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', payload: { editor: monaco.editor.IStandaloneCodeEditor; monaco: typeof monaco }): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'validate', markers: monaco.editor.IMarker[]): void
  (e: 'error', error: unknown): void
}>()

const containerRef = ref<HTMLElement>()
const loadError = ref<string>()

let monacoInstance: typeof monaco | undefined
let editor: monaco.editor.IStandaloneCodeEditor | undefined
let currentModel: AcquiredModel | undefined
let resizeObserver: ResizeObserver | undefined
let markerListener: monaco.IDisposable | undefined
let modelContentListener: monaco.IDisposable | undefined
let focusListener: monaco.IDisposable | undefined
let blurListener: monaco.IDisposable | undefined
let suppressModelEvent = false

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

const deepMergeRecords = (
  base: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(source)) {
    const current = result[key]
    if (isPlainRecord(current) && isPlainRecord(value)) {
      result[key] = deepMergeRecords(current, value)
      continue
    }

    result[key] = value
  }

  return result
}

const resolveEditorOptions = (): monaco.editor.IStandaloneEditorConstructionOptions => {
  const baseOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    placeholder: props.placeholder,
    wordWrap: props.wordWrap,
    fontSize: props.fontSize,
    readOnly: props.readonly,
    lineNumbers: props.lineNumbers,
    minimap: { enabled: props.minimap },
    automaticLayout: false,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
  }

  const mergedBase = deepMergeRecords(
    baseOptions as unknown as Record<string, unknown>,
    (props.options ?? {}) as unknown as Record<string, unknown>,
  )
  const resolved = mergedBase as monaco.editor.IStandaloneEditorConstructionOptions

  // Keep explicit props as the highest-priority source of truth.
  resolved.value = props.modelValue
  resolved.language = props.language
  resolved.theme = props.theme
  resolved.placeholder = props.placeholder
  resolved.wordWrap = props.wordWrap
  resolved.fontSize = props.fontSize
  resolved.readOnly = props.readonly
  resolved.lineNumbers = props.lineNumbers
  resolved.minimap = { ...(resolved.minimap ?? {}), enabled: props.minimap }

  return resolved
}

const applyRuntimeOptions = (): void => {
  if (!editor) {
    return
  }

  const resolved = resolveEditorOptions()
  const { value: _value, language: _language, theme: _theme, ...runtimeOptions } = resolved
  editor.updateOptions(runtimeOptions)
}

const normalizeSize = (size: number | string): string => {
  if (typeof size === 'number') {
    return `${size}px`
  }

  return size
}

const editorStyle = () => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height),
})

const emitValidation = (): void => {
  if (!monacoInstance || !currentModel) {
    return
  }

  const markers = monacoInstance.editor.getModelMarkers({ resource: currentModel.model.uri })
  emit('validate', markers)
}

const syncExternalModelValue = (value: string): void => {
  if (!editor) {
    return
  }

  if (editor.getValue() === value) {
    return
  }

  suppressModelEvent = true
  editor.getModel()?.setValue(value)
  suppressModelEvent = false
}

const bindModelListeners = (): void => {
  modelContentListener?.dispose()
  focusListener?.dispose()
  blurListener?.dispose()

  if (!editor) {
    return
  }

  modelContentListener = editor.onDidChangeModelContent(() => {
    if (suppressModelEvent) {
      return
    }
    const value = editor?.getValue() ?? ''
    emit('update:modelValue', value)
    emit('change', value)
  })

  focusListener = editor.onDidFocusEditorText(() => emit('focus'))
  blurListener = editor.onDidBlurEditorText(() => emit('blur'))
}

const mountModel = (value: string): void => {
  if (!editor || !monacoInstance) {
    return
  }

  currentModel?.release()
  currentModel = acquireModel(value, props.language, props.path)
  editor.setModel(currentModel.model)
  monacoInstance.editor.setTheme(props.theme)
  emitValidation()
}

const createEditor = (): void => {
  if (!containerRef.value) {
    return
  }

  monacoInstance = setupMonaco()
  const options = resolveEditorOptions()

  editor = monacoInstance.editor.create(containerRef.value, options)
  mountModel(props.modelValue)
  bindModelListeners()

  markerListener = monacoInstance.editor.onDidChangeMarkers((uris) => {
    const modelUri = currentModel?.model.uri.toString()
    if (!modelUri) {
      return
    }

    const changed = uris.some((uri) => uri.toString() === modelUri)
    if (changed) {
      emitValidation()
    }
  })

  resizeObserver = new ResizeObserver(() => editor?.layout())
  resizeObserver.observe(containerRef.value)

  if (props.autofocus) {
    editor.focus()
  }

  emit('ready', { editor, monaco: monacoInstance })
}

watch(
  () => props.modelValue,
  (value) => {
    syncExternalModelValue(value)
  },
)

watch(
  () => props.theme,
  (theme) => {
    monacoInstance?.editor.setTheme(theme)
  },
)

watch(
  () => props.language,
  (language) => {
    const model = currentModel?.model
    if (model && model.getLanguageId() !== language) {
      monacoInstance?.editor.setModelLanguage(model, language)
    }
  },
)

watch(
  () => props.path,
  () => {
    mountModel(props.modelValue)
    bindModelListeners()
  },
)

watch(
  [
    () => props.options,
    () => props.lineNumbers,
    () => props.readonly,
    () => props.placeholder,
    () => props.wordWrap,
    () => props.fontSize,
    () => props.minimap,
  ],
  () => {
    applyRuntimeOptions()
  },
  { deep: true },
)

onMounted(() => {
  try {
    createEditor()
  } catch (error) {
    loadError.value = 'Failed to initialize MonacoEditor.'
    emit('error', error)
  }
})

onBeforeUnmount(() => {
  markerListener?.dispose()
  modelContentListener?.dispose()
  focusListener?.dispose()
  blurListener?.dispose()
  resizeObserver?.disconnect()
  editor?.dispose()
  currentModel?.release()
})

const formatDocument = async (): Promise<void> => {
  await editor?.getAction('editor.action.formatDocument')?.run()
}

defineExpose<MonacoEditorExpose>({
  focus: () => editor?.focus(),
  blur: () => editor?.getDomNode()?.blur(),
  formatDocument,
  getEditor: () => editor,
  getModel: () => currentModel?.model,
})
</script>

<template>
  <div class="monaco-editor-root">
    <div ref="containerRef" class="monaco-editor-container" :style="editorStyle()" />
    <div v-if="loadError" class="monaco-editor-error">
      <slot name="error">
        {{ loadError }}
      </slot>
    </div>
  </div>
</template>

<style scoped>
.monaco-editor-root {
  position: relative;
  width: 100%;
}

.monaco-editor-container {
  width: 100%;
  min-height: 160px;
  overflow: hidden;
}

.monaco-editor-error {
  margin-top: 8px;
  color: #b91c1c;
  font-size: 12px;
}
</style>
