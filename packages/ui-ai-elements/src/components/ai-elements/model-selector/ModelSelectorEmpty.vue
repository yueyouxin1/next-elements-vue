<script setup lang="ts">
import { CommandEmpty } from '@repo/ui-shadcn/components/ui/command'
</script>

<template>
  <CommandEmpty v-bind="$attrs">
    <slot />
  </CommandEmpty>
</template>
