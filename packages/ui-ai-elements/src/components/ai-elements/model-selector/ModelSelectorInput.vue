<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CommandInput } from '@repo/ui-shadcn/components/ui/command'
import { cn } from '@repo/ui-shadcn/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <CommandInput
    :class="cn('h-auto py-3.5', props.class)"
    v-bind="$attrs"
  />
</template>
