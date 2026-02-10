<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CardHeader } from '@repo/ui-shadcn/components/ui/card'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <CardHeader
    :class="cn('flex flex-row items-start justify-between', props.class)"
    data-slot="plan-header"
  >
    <slot />
  </CardHeader>
</template>
