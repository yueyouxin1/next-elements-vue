import type { RouteRecordRaw } from 'vue-router'
import { componentsRoutes } from '@app/router/routes/components.routes'
import { homeRoutes } from '@app/router/routes/home.routes'
import { systemRoutes } from '@app/router/routes/system.routes'

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...componentsRoutes,
  ...systemRoutes,
]
