<script setup lang="ts">
import { Dialog } from '@repo/ui-shadcn/components/ui/dialog'
</script>

<template>
  <Dialog v-bind="$attrs">
    <slot />
  </Dialog>
</template>
