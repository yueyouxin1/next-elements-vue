<script setup lang="ts">
import { CommandList } from '@repo/ui-shadcn/components/ui/command'
</script>

<template>
  <CommandList v-bind="$attrs">
    <slot />
  </CommandList>
</template>
