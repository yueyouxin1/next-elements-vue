<script setup lang="ts">
import { CardContent } from '@repo/ui-shadcn/components/ui/card'
import { CollapsibleContent } from '@repo/ui-shadcn/components/ui/collapsible'
</script>

<template>
  <CollapsibleContent as-child>
    <CardContent data-slot="plan-content">
      <slot />
    </CardContent>
  </CollapsibleContent>
</template>
