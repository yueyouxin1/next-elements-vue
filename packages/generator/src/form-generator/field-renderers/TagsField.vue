<script setup lang="ts">
import { computed, ref } from "vue"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Input } from "@repo/ui-shadcn/components/ui/input"

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  fieldProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: unknown): void
}>()

const draft = ref("")
const tags = computed<string[]>(() => {
  if (!Array.isArray(props.modelValue)) {
    return []
  }
  return props.modelValue.map((item) => String(item)).filter(Boolean)
})

function appendTag(raw: string): void {
  const nextTag = raw.trim()
  if (!nextTag || tags.value.includes(nextTag)) {
    draft.value = ""
    return
  }
  emit("update:modelValue", [...tags.value, nextTag])
  draft.value = ""
}

function removeTag(tag: string): void {
  emit(
    "update:modelValue",
    tags.value.filter((item) => item !== tag),
  )
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-2">
      <Badge
        v-for="tag in tags"
        :key="tag"
        variant="secondary"
        class="gap-1"
      >
        {{ tag }}
        <button
          type="button"
          :disabled="disabled || Boolean(fieldProps?.disabled)"
          class="cursor-pointer"
          @click="removeTag(tag)"
        >
          x
        </button>
      </Badge>
    </div>
    <div class="flex items-center gap-2">
      <Input
        v-model="draft"
        :placeholder="String(fieldProps?.placeholder ?? '输入并添加标签')"
        :disabled="disabled || Boolean(fieldProps?.disabled)"
        @keyup.enter.prevent="appendTag(draft)"
      />
      <Button
        type="button"
        size="sm"
        :disabled="disabled || Boolean(fieldProps?.disabled)"
        @click="appendTag(draft)"
      >
        添加
      </Button>
    </div>
  </div>
</template>

