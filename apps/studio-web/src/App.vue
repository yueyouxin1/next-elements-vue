<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@app/layouts/AppLayout.vue'
import BlankLayout from '@app/layouts/BlankLayout.vue'
import WorkspaceLayout from '@app/layouts/WorkspaceLayout.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  if (route.meta.layout === 'app') {
    return AppLayout
  }

  if (route.meta.layout === 'workspace') {
    return WorkspaceLayout
  }

  return BlankLayout
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layoutComponent">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
