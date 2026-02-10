import type { RuntimeConfig } from '@app/core/bootstrap/runtime-config'

export const initLogger = (config: RuntimeConfig): void => {
  if (config.env === 'production') {
    return
  }

  console.info(`[bootstrap] app=${config.appName} env=${config.env}`)
}
