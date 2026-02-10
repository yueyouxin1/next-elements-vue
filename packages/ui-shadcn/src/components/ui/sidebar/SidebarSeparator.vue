<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@repo/ui-shadcn/lib/utils"
import { Separator } from '@repo/ui-shadcn/components/ui/separator'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Separator
    data-slot="sidebar-separator"
    data-sidebar="separator"
    :class="cn('bg-sidebar-border mx-2 w-auto', props.class)"
  >
    <slot />
  </Separator>
</template>
