<script setup lang="ts">
import { computed, ref } from "vue"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui-shadcn/components/ui/select"
import {
  WorkflowInputTree,
  type InputTreeNodeValue,
} from "@repo/workflow/playground/src/form-extensions"

type DemoMode = "default" | "readonly" | "disabled" | "top-level-readonly" | "max-limit" | "error"

const mode = ref<DemoMode>("default")
const defaultCollapse = ref(false)
const columnsRatio = ref("4:6")

const model = ref<InputTreeNodeValue[]>([
  {
    key: "root-1",
    name: "BOT_USER_INPUT",
    type: "string",
    required: false,
  },
  {
    key: "root-2",
    name: "HotNews",
    type: "string",
    required: true,
  },
  {
    key: "root-3",
    name: "payload",
    type: "object",
    input: {
      type: "literal",
      content: {},
    },
    children: [
      {
        key: "root-3-1",
        name: "search",
        type: "object",
        children: [
          {
            key: "root-3-1-1",
            name: "keyword",
            type: "string",
          },
          {
            key: "root-3-1-2",
            name: "limit",
            type: "integer",
          },
        ],
      },
      {
        key: "root-3-2",
        name: "meta",
        type: "object",
        children: [
          {
            key: "root-3-2-1",
            name: "traceId",
            type: "string",
          },
        ],
      },
    ],
  },
])

const validationErrors = computed(() => {
  if (mode.value !== "error") {
    return {} as Record<string, string>
  }

  return {
    "[0].name": "变量名不能为空",
    "[2].children[0].children[1].type": "类型不符合当前节点限制",
  } as Record<string, string>
})

const modeOptions: Array<{ label: string, value: DemoMode }> = [
  { label: "默认", value: "default" },
  { label: "只读", value: "readonly" },
  { label: "禁用", value: "disabled" },
  { label: "顶层只读", value: "top-level-readonly" },
  { label: "达到上限", value: "max-limit" },
  { label: "错误态", value: "error" },
]

const ratioOptions = ["3:7", "4:6", "5:5", "6:4"]

const isReadonly = computed(() => mode.value === "readonly")
const isDisabled = computed(() => mode.value === "disabled")
const isTopLevelReadonly = computed(() => mode.value === "top-level-readonly")
const maxLimit = computed(() => (mode.value === "max-limit" ? 3 : undefined))
const disableDelete = computed(() => mode.value === "disabled")

function resetData(): void {
  model.value = [
    {
      key: "root-1",
      name: "BOT_USER_INPUT",
      type: "string",
      required: false,
    },
    {
      key: "root-2",
      name: "HotNews",
      type: "string",
      required: true,
    },
    {
      key: "root-3",
      name: "payload",
      type: "object",
      input: {
        type: "literal",
        content: {},
      },
      children: [
        {
          key: "root-3-1",
          name: "search",
          type: "object",
          children: [
            {
              key: "root-3-1-1",
              name: "keyword",
              type: "string",
            },
            {
              key: "root-3-1-2",
              name: "limit",
              type: "integer",
            },
          ],
        },
        {
          key: "root-3-2",
          name: "meta",
          type: "object",
          children: [
            {
              key: "root-3-2-1",
              name: "traceId",
              type: "string",
            },
          ],
        },
      ],
    },
  ]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="w-40">
        <Select v-model="mode">
          <SelectTrigger>
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in modeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="w-28">
        <Select v-model="columnsRatio">
          <SelectTrigger>
            <SelectValue placeholder="列宽比" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in ratioOptions" :key="item" :value="item">
              {{ item }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" @click="defaultCollapse = !defaultCollapse">
        默认折叠：{{ defaultCollapse ? "开" : "关" }}
      </Button>

      <Button variant="outline" size="sm" @click="resetData">
        重置数据
      </Button>
    </div>

    <WorkflowInputTree
      v-model:value="model"
      test-id="workflow-input-tree-demo"
      title="输入"
      :readonly="isReadonly"
      :disabled="isDisabled"
      :top-level-readonly="isTopLevelReadonly"
      :max-limit="maxLimit"
      :disable-delete="disableDelete"
      :nth-cannot-deleted="1"
      :columns-ratio="columnsRatio"
      :default-collapse="defaultCollapse"
      :validation-errors="validationErrors"
      :show-validation="mode === 'error'"
      add-item-title="添加输入参数"
      empty-placeholder="暂无输入参数"
    />

    <div class="rounded-lg border bg-muted/40 p-3">
      <p class="mb-2 text-sm font-medium text-slate-700">
        当前值回显
      </p>
      <pre class="max-h-[260px] overflow-auto text-xs leading-5 text-slate-600">{{ JSON.stringify(model, null, 2) }}</pre>
    </div>
  </div>
</template>
