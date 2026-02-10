import { createI18n } from 'vue-i18n'
import { appI18nMessages, fallbackLocale, type AppLocale } from '@repo/common/i18n/messages'

const supportedLocales = Object.keys(appI18nMessages) as AppLocale[]

const isSupportedLocale = (locale: string): locale is AppLocale => {
  return supportedLocales.includes(locale as AppLocale)
}

export const createAppI18n = (locale: string) => {
  const resolvedLocale: AppLocale = isSupportedLocale(locale) ? locale : 'zh-CN'

  return createI18n({
    legacy: false,
    locale: resolvedLocale,
    fallbackLocale,
    messages: appI18nMessages,
  })
}
