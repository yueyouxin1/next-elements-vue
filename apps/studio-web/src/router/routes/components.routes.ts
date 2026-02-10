import type { RouteRecordRaw } from 'vue-router'

export const componentsRoutes: RouteRecordRaw[] = [
  {
    path: '/components',
    name: 'components',
    component: () => import('@app/views/ComponentCatalogView.vue'),
    meta: {
      layout: 'blank',
      analyticsId: 'components.catalog',
    },
  },
  {
    path: '/components/:slug',
    name: 'component-playground',
    component: () => import('@app/views/ComponentPlaygroundView.vue'),
    props: true,
    meta: {
      layout: 'blank',
      analyticsId: 'components.playground',
    },
  },
]
