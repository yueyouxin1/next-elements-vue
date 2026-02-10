<script setup lang="ts">
import { RouterLink } from "vue-router"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"
import {
  IconChevronRight,
  IconDashboard,
} from "@tabler/icons-vue"
import { componentDemos } from "@app/data/component-demos"
</script>

<template>
  <main class="mx-auto w-full max-w-7xl space-y-4 px-3 py-4 md:px-6 md:py-5">
    <header class="sticky top-0 z-20 -mx-3 border-b bg-background/85 px-3 py-2 backdrop-blur md:-mx-6 md:px-6">
      <div class="mx-auto flex w-full max-w-7xl items-center gap-2">
        <RouterLink to="/" aria-label="返回首页" title="返回首页">
          <Button variant="ghost" size="icon-sm">
            <IconDashboard />
          </Button>
        </RouterLink>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-sm font-semibold tracking-tight">
            组件目录
          </h1>
        </div>
        <Badge variant="secondary" class="rounded-full px-2.5 py-0.5 text-xs">
          {{ componentDemos.length }} demos
        </Badge>
      </div>
    </header>

    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="demo in componentDemos"
        :key="demo.slug"
        :to="{ name: 'component-playground', params: { slug: demo.slug } }"
        class="group block h-full"
      >
        <Card class="h-full border-muted/60 bg-card/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
          <CardHeader class="space-y-2 pb-3">
            <CardTitle class="flex items-start justify-between gap-3 text-base">
              <span>{{ demo.title }}</span>
              <IconChevronRight class="mt-0.5 size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </CardTitle>
            <CardDescription class="text-xs leading-5 text-muted-foreground/90">
              {{ demo.description }}
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="tag in demo.tags"
                :key="tag"
                variant="secondary"
                class="text-[11px]"
              >
                {{ tag }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </RouterLink>
    </section>
  </main>
</template>
