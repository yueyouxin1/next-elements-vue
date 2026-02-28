<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { RouterLink, useRoute } from "vue-router"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui-shadcn/components/ui/card"
import {
  IconDashboard,
  IconListDetails,
  IconMenu2,
} from "@tabler/icons-vue"
import { getComponentDemoBySlug } from "@app/data/component-demos"

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ""))
const demo = computed(() => getComponentDemoBySlug(slug.value))
const navExpanded = ref(false)
const menuX = ref(16)
const menuY = ref(16)

let dragging = false
let moved = false
let startX = 0
let startY = 0
let originX = 0
let originY = 0

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const menuStyle = computed(() => ({
  left: `${menuX.value}px`,
  top: `${menuY.value}px`,
}))

const onPointerMove = (event: PointerEvent) => {
  if (!dragging) {
    return
  }

  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  if (!moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
    moved = true
  }

  const maxX = window.innerWidth - 56
  const maxY = window.innerHeight - 56
  menuX.value = clamp(originX + deltaX, 8, maxX)
  menuY.value = clamp(originY + deltaY, 8, maxY)
}

const stopDrag = () => {
  dragging = false
  window.removeEventListener("pointermove", onPointerMove)
  window.removeEventListener("pointerup", onPointerUp)
}

const onPointerUp = () => {
  const wasMoved = moved
  stopDrag()
  if (!wasMoved) {
    navExpanded.value = !navExpanded.value
  }
}

const onMenuPointerDown = (event: PointerEvent) => {
  if (event.button !== 0) {
    return
  }

  dragging = true
  moved = false
  startX = event.clientX
  startY = event.clientY
  originX = menuX.value
  originY = menuY.value
  window.addEventListener("pointermove", onPointerMove)
  window.addEventListener("pointerup", onPointerUp)
}

onBeforeUnmount(() => {
  stopDrag()
})
</script>

<template>
  <main class="relative isolate flex h-dvh w-full flex-col overflow-hidden">
    <section v-if="demo" class="relative z-0 min-h-0 flex-1 overflow-auto">
      <component :is="demo.component" />
    </section>

    <section v-else class="min-h-0 flex-1 overflow-auto">
      <div class="flex min-h-full items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>未找到对应组件</CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground">
            请返回组件列表重新选择。
          </CardContent>
        </Card>
      </div>
    </section>

    <div class="pointer-events-none fixed inset-0 z-[1000]">
      <div class="pointer-events-auto absolute" :style="menuStyle">
        <button
          type="button"
          class="flex h-12 w-12 cursor-move items-center justify-center rounded-full border bg-background/92 shadow-sm backdrop-blur"
          :aria-label="navExpanded ? '收起导航' : '展开导航'"
          :title="navExpanded ? '收起导航' : '展开导航'"
          @pointerdown.prevent="onMenuPointerDown"
        >
          <IconMenu2 class="size-5" />
        </button>

        <template v-if="navExpanded">
          <div class="absolute left-14 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border bg-background/92 p-1 shadow-sm backdrop-blur">
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
            <div v-if="demo" class="min-w-0 px-1">
              <h1 class="max-w-[40vw] truncate text-sm font-semibold tracking-tight">
                {{ demo.title }}
              </h1>
            </div>
            <Badge v-if="demo" variant="secondary" class="rounded-full px-2 py-0.5 text-[11px]">
              PlayGround
            </Badge>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>
