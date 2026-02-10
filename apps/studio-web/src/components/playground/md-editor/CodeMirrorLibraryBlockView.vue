<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Button } from "@repo/ui-shadcn/components/ui/button"

const props = defineProps<{
  source: string
}>()

const emit = defineEmits<{
  (e: "update", payload: { newText: string }): void
  (e: "remove"): void
}>()

const name = ref("")

const extractName = (raw: string): string => {
  const matched = raw.match(/name="([^"]*)"/)
  return matched?.[1] ?? "library"
}

const buildBlockText = (nextName: string): string => {
  const normalized = nextName.trim() || "library"
  if (/name="[^"]*"/.test(props.source)) {
    return props.source.replace(/name="[^"]*"/, `name="${normalized}"`)
  }
  return `{#LibraryBlock name="${normalized}"#}\nBlock content\n{#/LibraryBlock#}`
}

watch(
  () => props.source,
  (source) => {
    name.value = extractName(source)
  },
  { immediate: true },
)

const title = computed(() => `LibraryBlock: ${name.value || "library"}`)

function applyRename(): void {
  emit("update", {
    newText: buildBlockText(name.value),
  })
}
</script>

<template>
  <div class="library-block rounded-md border bg-background px-3 py-2">
    <p class="mb-2 text-xs font-medium text-muted-foreground">
      {{ title }}
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="name"
        type="text"
        class="h-8 min-w-[160px] rounded border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
      >
      <Button type="button" size="sm" variant="outline" @click="applyRename">
        Rename
      </Button>
      <Button type="button" size="sm" variant="destructive" @click="emit('remove')">
        Remove
      </Button>
    </div>
  </div>
</template>

<style scoped>
.library-block {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, hsl(var(--border)) 70%, transparent);
}
</style>

