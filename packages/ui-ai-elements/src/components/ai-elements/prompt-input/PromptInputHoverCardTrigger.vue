<script setup lang="ts">
import { HoverCardTrigger } from '@repo/ui-shadcn/components/ui/hover-card'

type PromptInputHoverCardTriggerProps = InstanceType<typeof HoverCardTrigger>['$props']

interface Props extends /* @vue-ignore */ PromptInputHoverCardTriggerProps {}

const props = defineProps<Props>()
</script>

<template>
  <HoverCardTrigger v-bind="props">
    <slot />
  </HoverCardTrigger>
</template>
