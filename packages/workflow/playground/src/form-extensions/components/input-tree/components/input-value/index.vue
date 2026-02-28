<script setup lang="ts">
import { computed } from "vue"
import { AlertCircle } from "lucide-vue-next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import type { SchemaType } from "../../../../../../../src/base"
import { MAX_TREE_LEVEL } from "../../constants"
import type { TreeNodeCustomData } from "../../types"

const props = withDefaults(defineProps<{
  data: TreeNodeCustomData
  level: number
  disabled?: boolean
  disabledTypes?: SchemaType[]
  error?: boolean
  style?: Record<string, string>
  testName?: string
}>(), {
  disabled: false,
  disabledTypes: () => [],
  error: false,
  style: () => ({}),
  testName: "",
})

const emit = defineEmits<{
  (event: "update", value: SchemaType): void
}>()

const typeOptions: Array<{ label: string, value: SchemaType }> = [
  { label: "str. String", value: "string" },
  { label: "num. Number", value: "number" },
  { label: "int. Integer", value: "integer" },
  { label: "bool. Boolean", value: "boolean" },
  { label: "obj. Object", value: "object" },
  { label: "arr. Array", value: "array" },
]

const finalDisabledTypes = computed(() => {
  if (props.data.type === "object" && (props.data.children?.length ?? 0) > 0) {
    return ["string", "number", "integer", "boolean", "array"] as SchemaType[]
  }

  const levelLimitTypes = props.level >= MAX_TREE_LEVEL ? (["object"] as SchemaType[]) : []
  return [...new Set([...levelLimitTypes, ...props.disabledTypes])]
})

const showLevelTip = computed(() => {
  return props.level >= MAX_TREE_LEVEL
})
</script>

<template>
  <div class="relative flex min-w-0 flex-col self-stretch" :style="style">
    <Select
      :model-value="data.type"
      :disabled="disabled"
      :data-testid="`${testName}/input`"
      @update:model-value="value => emit('update', String(value ?? 'string') as SchemaType)"
    >
      <SelectTrigger
        class="h-8 min-w-0 text-xs"
        :class="error ? 'border-red-300 ring-red-100' : ''"
      >
        <SelectValue placeholder="类型" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in typeOptions"
          :key="option.value"
          :value="option.value"
          :disabled="finalDisabledTypes.includes(option.value)"
        >
          <div class="flex items-center justify-between gap-2">
            <span>{{ option.label }}</span>
            <AlertCircle v-if="finalDisabledTypes.includes(option.value)" class="size-3 text-slate-300" />
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
    <p v-if="showLevelTip" class="mt-1 text-[11px] leading-4 text-slate-400">
      最大仅支持 3 层 Object 嵌套
    </p>
  </div>
</template>
