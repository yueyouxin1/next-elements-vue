import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'

export const appI18nMessages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export type AppLocale = keyof typeof appI18nMessages

export const fallbackLocale: AppLocale = 'en-US'
