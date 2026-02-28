<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, useRoute } from "vue-router"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui-shadcn/components/ui/card"
import {
  IconDashboard,
  IconListDetails,
} from "@tabler/icons-vue"
import { getComponentDemoBySlug } from "@app/data/component-demos"

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ""))
const demo = computed(() => getComponentDemoBySlug(slug.value))
</script>

<template>
  <main class="mx-auto flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden px-2 py-2 md:px-3 md:py-3">
    <header class="mb-2 shrink-0 border-b bg-background px-1 py-1.5 md:px-2">
      <div class="flex items-center gap-2">
        <RouterLink to="/components" aria-label="返回组件列表" title="返回组件列表">
          <Button variant="ghost" size="icon-sm">
            <IconListDetails />
          </Button>
        </RouterLink>
        <RouterLink to="/" aria-label="返回首页" title="返回首页">
          <Button variant="ghost" size="icon-sm">
            <IconDashboard />
          </Button>
        </RouterLink>
        <div v-if="demo" class="min-w-0 flex-1">
          <h1 class="truncate text-sm font-semibold tracking-tight">
            {{ demo.title }}
          </h1>
        </div>
        <Badge v-if="demo" variant="secondary" class="rounded-full px-2 py-0.5 text-[11px]">
          PlayGround
        </Badge>
      </div>
    </header>

    <section v-if="demo" class="min-h-0 flex-1 overflow-y-auto">
      <div class="h-full rounded-lg border bg-background/30 p-1.5 md:p-2">
          <component :is="demo.component" />
      </div>
    </section>

    <section v-else class="min-h-0 flex-1 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>未找到对应组件</CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground">
          请返回组件列表重新选择。
        </CardContent>
      </Card>
    </section>
  </main>
</template>
