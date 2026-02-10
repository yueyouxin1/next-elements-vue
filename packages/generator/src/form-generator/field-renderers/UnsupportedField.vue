<script setup lang="ts">
const props = defineProps<{
  modelValue?: unknown
  fieldProps?: Record<string, unknown>
}>()
</script>

<template>
  <div class="rounded-md border border-dashed border-destructive/50 p-3 text-xs text-muted-foreground">
    Unsupported field renderer: {{ String(fieldProps?.control ?? "unknown") }}.
    value: {{ modelValue }}
  </div>
</template>

