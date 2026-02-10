import { VueQueryPlugin } from '@tanstack/vue-query'
import type { App } from 'vue'
import type { Router } from 'vue-router'
import { CommonUiPlugin } from '@repo/common/plugin'
import { createAppI18n } from '@app/core/providers/i18n'
import { pinia } from '@app/core/providers/pinia'
import { queryClient } from '@app/core/providers/query-client'
import type { RuntimeConfig } from '@app/core/bootstrap/runtime-config'

export const registerAppProviders = (app: App, router: Router, config: RuntimeConfig): void => {
  app.use(CommonUiPlugin)
  app.use(pinia)
  app.use(router)
  app.use(createAppI18n(config.locale))
  app.use(VueQueryPlugin, { queryClient })
}
