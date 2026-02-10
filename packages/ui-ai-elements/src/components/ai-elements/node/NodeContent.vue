<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import CardContent from '@repo/ui-shadcn/components/ui/card/CardContent.vue'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <CardContent :class="cn('p-3', props.class)">
    <slot />
  </CardContent>
</template>
