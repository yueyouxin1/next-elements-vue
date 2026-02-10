import { monaco } from './monaco-api'
import type * as Monaco from 'monaco-editor'

type ModelEntry = {
  model: Monaco.editor.ITextModel
  refs: number
}

const pooledModels = new Map<string, ModelEntry>()

const resolveUri = (path?: string): Monaco.Uri | undefined => {
  if (!path) {
    return undefined
  }

  if (path.includes('://')) {
    return monaco.Uri.parse(path)
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return monaco.Uri.parse(`inmemory://model${normalizedPath}`)
}

export type AcquiredModel = {
  model: Monaco.editor.ITextModel
  release: () => void
}

export const acquireModel = (value: string, language: string, path?: string): AcquiredModel => {
  const uri = resolveUri(path)

  if (!uri) {
    const model = monaco.editor.createModel(value, language)
    return {
      model,
      release: () => model.dispose(),
    }
  }

  const key = uri.toString()
  const existing = pooledModels.get(key)
  if (existing && !existing.model.isDisposed()) {
    existing.refs += 1
    if (existing.model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(existing.model, language)
    }
    return {
      model: existing.model,
      release: () => releaseModel(key),
    }
  }

  const model = monaco.editor.createModel(value, language, uri)
  pooledModels.set(key, { model, refs: 1 })

  return {
    model,
    release: () => releaseModel(key),
  }
}

const releaseModel = (key: string): void => {
  const entry = pooledModels.get(key)
  if (!entry) {
    return
  }

  entry.refs -= 1
  if (entry.refs > 0) {
    return
  }

  if (!entry.model.isDisposed()) {
    entry.model.dispose()
  }
  pooledModels.delete(key)
}
