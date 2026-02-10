<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@repo/ui-shadcn/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('w-full p-3', props.class)" v-bind="$attrs">
    <slot />
  </div>
</template>
