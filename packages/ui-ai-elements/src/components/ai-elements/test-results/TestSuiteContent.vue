<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CollapsibleContent } from '@repo/ui-shadcn/components/ui/collapsible'
import { cn } from '@repo/ui-shadcn/lib/utils'

type TestSuiteContentProps = InstanceType<typeof CollapsibleContent>['$props']

interface Props extends /* @vue-ignore */ TestSuiteContentProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <CollapsibleContent
    :class="cn('border-t', props.class)"
    v-bind="$attrs"
  >
    <div class="divide-y">
      <slot />
    </div>
  </CollapsibleContent>
</template>
