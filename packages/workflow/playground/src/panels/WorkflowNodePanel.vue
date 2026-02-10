<script setup lang="ts">
import type { ParameterSchema, WorkflowCanvasNode } from "../../../src/base"
import { computed } from "vue"
import { AlertCircle, Minus, Plus, Trash2, X } from "lucide-vue-next"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Checkbox } from "@repo/ui-shadcn/components/ui/checkbox"
import { Input } from "@repo/ui-shadcn/components/ui/input"
import { Label } from "@repo/ui-shadcn/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import { Switch } from "@repo/ui-shadcn/components/ui/switch"
import { Textarea } from "@repo/ui-shadcn/components/ui/textarea"

const props = defineProps<{
  node: WorkflowCanvasNode | null
  readonly: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (event: "update-name", value: string): void
  (event: "update-description", value: string): void
  (event: "update-config", payload: { key: string; value: unknown }): void
  (event: "update-schemas", payload: { field: "inputs" | "outputs"; schemas: ParameterSchema[] }): void
  (event: "close"): void
  (event: "delete"): void
}>()

const formDisabled = computed(() => props.readonly || props.disabled || !props.node)

const isStartNode = computed(() => props.node?.data.registryId === "Start")

const schemaField = computed<"inputs" | "outputs">(() => (isStartNode.value ? "outputs" : "inputs"))

const schemaRows = computed(() => {
  if (!props.node) {
    return []
  }
  return props.node.data[schemaField.value]
})

const returnType = computed(() => {
  const value = props.node?.data.config.returnType
  return value === "Text" ? "Text" : "Object"
})

const streamEnabled = computed(() => Boolean(props.node?.data.config.stream))

const defaultValue = computed(() => String(props.node?.data.config.content ?? ""))

const schemaTypeOptions: Array<{ label: string; value: ParameterSchema["type"] }> = [
  { label: "str. String", value: "string" },
  { label: "num. Number", value: "number" },
  { label: "int. Integer", value: "integer" },
  { label: "bool. Boolean", value: "boolean" },
  { label: "obj. Object", value: "object" },
  { label: "arr. Array", value: "array" },
]

function updateSchemaRow(index: number, patch: Partial<ParameterSchema>): void {
  if (formDisabled.value || !props.node) {
    return
  }

  const nextRows = schemaRows.value.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return { ...item }
    }

    return {
      ...item,
      ...patch,
    }
  })

  emit("update-schemas", { field: schemaField.value, schemas: nextRows })
}

function addSchemaRow(): void {
  if (formDisabled.value) {
    return
  }

  const nextRows = [
    ...schemaRows.value.map(item => ({ ...item })),
    {
      name: `param_${schemaRows.value.length + 1}`,
      type: "string",
      required: false,
    } satisfies ParameterSchema,
  ]

  emit("update-schemas", { field: schemaField.value, schemas: nextRows })
}

function removeSchemaRow(index: number): void {
  if (formDisabled.value) {
    return
  }

  const nextRows = schemaRows.value
    .filter((_, itemIndex) => itemIndex !== index)
    .map(item => ({ ...item }))

  emit("update-schemas", { field: schemaField.value, schemas: nextRows })
}
</script>

<template>
  <aside class="flex h-full flex-col border-l border-[#dde2ec] bg-[#f7f8fc]">
    <header class="flex items-start justify-between border-b border-[#dde2ec] bg-white px-5 py-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-900">
          {{ node?.data.name ?? "节点配置" }}
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ node?.data.description ?? "请选择节点进行配置编辑。" }}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" class="text-slate-400" @click="emit('close')">
        <X class="size-4" />
      </Button>
    </header>

    <div class="flex-1 space-y-5 overflow-auto px-5 py-4">
      <template v-if="node">
        <div class="space-y-2">
          <Label class="text-xs text-slate-500">节点名称</Label>
          <Input
            :model-value="node.data.name"
            :disabled="formDisabled"
            @update:model-value="(value) => emit('update-name', String(value ?? ''))"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs text-slate-500">{{ isStartNode ? "输入" : "变量" }}</Label>
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-slate-500"
              :disabled="formDisabled"
              @click="addSchemaRow"
            >
              <Plus class="size-4" />
            </Button>
          </div>
          <div class="overflow-hidden rounded-lg border border-[#e2e7f2] bg-white">
            <div class="grid grid-cols-[1.2fr_1fr_58px_42px] items-center gap-2 border-b border-[#eef1f7] px-3 py-2 text-xs text-slate-500">
              <span>变量名</span>
              <span>变量类型</span>
              <span>必填</span>
              <span />
            </div>
            <div
              v-for="(item, index) in schemaRows"
              :key="item.name"
              class="grid grid-cols-[1.2fr_1fr_58px_42px] items-center gap-2 border-b border-[#f4f6fb] px-3 py-2 text-sm last:border-b-0"
            >
              <Input
                :model-value="item.name"
                :disabled="formDisabled"
                class="h-8 text-sm"
                @update:model-value="(value) => updateSchemaRow(index, { name: String(value ?? '') })"
              />
              <Select
                :model-value="item.type"
                :disabled="formDisabled"
                @update:model-value="(value) => updateSchemaRow(index, { type: String(value ?? 'string') as ParameterSchema['type'] })"
              >
                <SelectTrigger class="h-8 min-w-0 text-xs">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="typeOption in schemaTypeOptions"
                    :key="typeOption.value"
                    :value="typeOption.value"
                  >
                    {{ typeOption.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div class="flex items-center justify-center">
                <Checkbox
                  :checked="Boolean(item.required)"
                  :disabled="formDisabled"
                  @update:checked="(value: boolean | 'indeterminate') => updateSchemaRow(index, { required: value === true })"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-slate-400"
                :disabled="formDisabled"
                @click="removeSchemaRow(index)"
              >
                <Minus class="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label class="text-xs text-slate-500">默认值</Label>
          <Input
            :model-value="defaultValue"
            :disabled="formDisabled"
            placeholder="参数默认值，在没有传入该参数时，将使用默认值"
            @update:model-value="(value) => emit('update-config', { key: 'content', value: String(value ?? '') })"
          />
        </div>

        <div class="space-y-2">
          <Label class="text-xs text-slate-500">描述</Label>
          <Textarea
            :model-value="node.data.description ?? ''"
            :disabled="formDisabled"
            rows="3"
            class="resize-none"
            @update:model-value="(value) => emit('update-description', String(value ?? ''))"
          />
        </div>

        <div v-if="!isStartNode" class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label class="text-xs text-slate-500">返回类型</Label>
            <Select
              :model-value="returnType"
              :disabled="formDisabled"
              @update:model-value="(value) => emit('update-config', { key: 'returnType', value })"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Object">
                  Object
                </SelectItem>
                <SelectItem value="Text">
                  Text
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label class="text-xs text-slate-500">流式输出</Label>
            <label class="mt-2 flex items-center gap-2 rounded-md border border-[#e2e7f2] bg-white px-3 py-2 text-sm">
              <Switch
                :model-value="streamEnabled"
                :disabled="formDisabled"
                @update:model-value="(value) => emit('update-config', { key: 'stream', value: Boolean(value) })"
              />
              <span>{{ streamEnabled ? "开启" : "关闭" }}</span>
            </label>
          </div>
        </div>
      </template>

      <div v-else class="rounded-lg border border-dashed bg-white px-4 py-8 text-center text-sm text-slate-500">
        请选择节点后编辑配置。
      </div>
    </div>

    <footer class="border-t border-[#dde2ec] bg-white px-5 py-3">
      <Button
        variant="outline"
        class="w-full justify-center border-red-200 text-red-600 hover:bg-red-50"
        :disabled="formDisabled"
        @click="emit('delete')"
      >
        <Trash2 class="size-4" />
        删除节点
      </Button>

      <p v-if="readonly" class="mt-2 inline-flex items-center gap-1 text-xs text-amber-600">
        <AlertCircle class="size-3" />
        当前为只读模式，禁止编辑
      </p>
    </footer>
  </aside>
</template>
