<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Collapsible } from '@repo/ui-shadcn/components/ui/collapsible'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Collapsible
    :class="cn('not-prose mb-4 text-primary text-xs', props.class)"
  >
    <slot />
  </Collapsible>
</template>
