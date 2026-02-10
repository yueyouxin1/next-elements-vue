<script setup lang="ts">
import { Button } from "@repo/ui-shadcn/components/ui/button"
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <h3 class="text-lg font-semibold">
        Variants
      </h3>
      <div class="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">
          Secondary
        </Button>
        <Button variant="outline">
          Outline
        </Button>
        <Button variant="ghost">
          Ghost
        </Button>
        <Button variant="destructive">
          Destructive
        </Button>
        <Button variant="link">
          Link
        </Button>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-lg font-semibold">
        Sizes
      </h3>
      <div class="flex flex-wrap items-center gap-3">
        <Button size="sm">
          Small
        </Button>
        <Button size="default">
          Default
        </Button>
        <Button size="lg">
          Large
        </Button>
        <Button size="icon" aria-label="Icon style button">
          +
        </Button>
      </div>
    </section>
  </div>
</template>
