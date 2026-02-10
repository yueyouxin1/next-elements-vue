import 'vue-router'

type AppLayout = 'app' | 'workspace' | 'blank'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: AppLayout
    requiresAuth?: boolean
    analyticsId?: string
    featureFlag?: string
  }
}

export {}
