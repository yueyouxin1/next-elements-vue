<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuContent } from '@repo/ui-shadcn/components/ui/dropdown-menu'
import { cn } from '@repo/ui-shadcn/lib/utils'

type DropdownMenuContentProps = InstanceType<typeof DropdownMenuContent>['$props']

interface Props extends /* @vue-ignore */ DropdownMenuContentProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { align, class: _, ...restProps } = props
</script>

<template>
  <DropdownMenuContent align="start" :class="cn(props.class)" v-bind="restProps">
    <slot />
  </DropdownMenuContent>
</template>
