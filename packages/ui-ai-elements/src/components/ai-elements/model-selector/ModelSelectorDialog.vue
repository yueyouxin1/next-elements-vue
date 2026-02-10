<script setup lang="ts">
import { CommandDialog } from '@repo/ui-shadcn/components/ui/command'
</script>

<template>
  <CommandDialog v-bind="$attrs">
    <slot />
  </CommandDialog>
</template>
