import { createApp } from 'vue'
import App from '@app/App.vue'
import router from '@app/router'
import { initLogger } from '@app/core/bootstrap/logger'
import { runPreflight } from '@app/core/bootstrap/preflight'
import { loadRuntimeConfig, runtimeConfigKey } from '@app/core/bootstrap/runtime-config'
import { registerAppProviders } from '@app/core/providers'

export const bootstrapApp = async (): Promise<void> => {
  const runtimeConfig = loadRuntimeConfig()
  initLogger(runtimeConfig)

  const app = createApp(App)
  app.provide(runtimeConfigKey, runtimeConfig)
  registerAppProviders(app, router, runtimeConfig)

  await runPreflight()
  app.mount('#app')
}
