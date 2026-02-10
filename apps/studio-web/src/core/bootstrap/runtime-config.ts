import type { InjectionKey } from 'vue'

export interface RuntimeConfig {
  appName: string
  env: string
  apiBaseUrl: string
  locale: string
}

export const runtimeConfigKey: InjectionKey<RuntimeConfig> = Symbol('runtime-config')

const readEnv = (key: string, fallback: string) => {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

export const loadRuntimeConfig = (): RuntimeConfig => {
  return {
    appName: readEnv('APP_NAME', 'studio-web'),
    env: readEnv('APP_ENV', import.meta.env.MODE),
    apiBaseUrl: readEnv('APP_API_BASE_URL', ''),
    locale: readEnv('APP_LOCALE', 'zh-CN'),
  }
}
