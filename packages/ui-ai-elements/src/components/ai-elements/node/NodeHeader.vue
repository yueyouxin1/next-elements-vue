<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import CardHeader from '@repo/ui-shadcn/components/ui/card/CardHeader.vue'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <CardHeader :class="cn('gap-0.5 rounded-t-md border-b bg-secondary p-3!', props.class)">
    <slot />
  </CardHeader>
</template>
