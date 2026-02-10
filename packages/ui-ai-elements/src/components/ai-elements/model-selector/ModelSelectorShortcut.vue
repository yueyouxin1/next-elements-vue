<script setup lang="ts">
import { CommandShortcut } from '@repo/ui-shadcn/components/ui/command'
</script>

<template>
  <CommandShortcut v-bind="$attrs">
    <slot />
  </CommandShortcut>
</template>
