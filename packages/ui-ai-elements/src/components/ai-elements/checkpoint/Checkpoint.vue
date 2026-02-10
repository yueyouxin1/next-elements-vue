<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { Separator } from '@repo/ui-shadcn/components/ui/separator'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('flex items-center gap-0.5 text-muted-foreground overflow-hidden', props.class)"
    v-bind="$attrs"
  >
    <slot />
    <Separator />
  </div>
</template>
