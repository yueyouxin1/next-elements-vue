import { computed, watch, type ComputedRef, type WritableComputedRef } from 'vue'
import { useColorMode, useStorage, type RemovableRef } from '@vueuse/core'

export type PlatformThemeName =
  | 'default'
  | 'stone'
  | 'zinc'
  | 'gray'
  | 'slate'
  | 'red'
  | 'rose'
  | 'orange'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'violet'

export type PlatformThemeOption = {
  value: PlatformThemeName
  label: string
  description: string
}

export const PLATFORM_THEME_OPTIONS: ReadonlyArray<PlatformThemeOption> = [
  { value: 'default', label: 'Neutral', description: 'Official default palette.' },
  { value: 'stone', label: 'Stone', description: 'Stone base color.' },
  { value: 'zinc', label: 'Zinc', description: 'Zinc base color.' },
  { value: 'gray', label: 'Gray', description: 'Gray base color.' },
  { value: 'slate', label: 'Slate', description: 'Slate base color.' },
  { value: 'red', label: 'Red', description: 'Red base color.' },
  { value: 'rose', label: 'Rose', description: 'Rose base color.' },
  { value: 'orange', label: 'Orange', description: 'Orange base color.' },
  { value: 'green', label: 'Green', description: 'Green base color.' },
  { value: 'blue', label: 'Blue', description: 'Blue base color.' },
  { value: 'yellow', label: 'Yellow', description: 'Yellow base color.' },
  { value: 'violet', label: 'Violet', description: 'Violet base color.' },
]

const THEME_STORAGE_KEY = 'platform-theme'
const LEGACY_THEME_STORAGE_KEY = 'dashboard-theme'
const THEME_DATASET_KEY = 'theme'

type PlatformThemeState = {
  themes: ReadonlyArray<PlatformThemeOption>
  selectedTheme: RemovableRef<PlatformThemeName>
  isDarkMode: WritableComputedRef<boolean>
  currentThemeOption: ComputedRef<PlatformThemeOption>
  setTheme: (theme: PlatformThemeName) => void
  setDarkMode: (enabled: boolean) => void
  toggleDarkMode: () => void
}

let cachedState: PlatformThemeState | undefined
let migratedLegacyTheme = false

function applyThemeToDocument(theme: PlatformThemeName) {
  if (typeof document === 'undefined') {
    return
  }

  if (theme === 'default') {
    delete document.documentElement.dataset[THEME_DATASET_KEY]
    return
  }

  document.documentElement.dataset[THEME_DATASET_KEY] = theme
}

function migrateLegacyThemeIfNeeded() {
  if (migratedLegacyTheme || typeof window === 'undefined') {
    return
  }

  migratedLegacyTheme = true

  const platformTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (platformTheme) {
    return
  }

  const legacyTheme = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
  if (legacyTheme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, legacyTheme)
  }
}

export function usePlatformTheme(): PlatformThemeState {
  if (cachedState) {
    return cachedState
  }

  migrateLegacyThemeIfNeeded()

  const selectedTheme = useStorage<PlatformThemeName>(THEME_STORAGE_KEY, 'default')
  const colorMode = useColorMode()
  const isDarkMode = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.value = value ? 'dark' : 'light'
    },
  })

  const setTheme = (theme: PlatformThemeName) => {
    selectedTheme.value = theme
  }

  const setDarkMode = (enabled: boolean) => {
    isDarkMode.value = enabled
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  const currentThemeOption = computed<PlatformThemeOption>(
    () =>
      PLATFORM_THEME_OPTIONS.find(option => option.value === selectedTheme.value)
      ?? PLATFORM_THEME_OPTIONS[0]!,
  )

  watch(selectedTheme, applyThemeToDocument, { immediate: true })

  const state: PlatformThemeState = {
    themes: PLATFORM_THEME_OPTIONS,
    selectedTheme,
    isDarkMode,
    currentThemeOption,
    setTheme,
    setDarkMode,
    toggleDarkMode,
  }

  cachedState = state
  return state
}

export function setPlatformTheme(theme: PlatformThemeName) {
  usePlatformTheme().setTheme(theme)
}

export function setPlatformDarkMode(enabled: boolean) {
  usePlatformTheme().setDarkMode(enabled)
}

export function togglePlatformDarkMode() {
  usePlatformTheme().toggleDarkMode()
}
