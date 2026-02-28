<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Plus } from "lucide-vue-next"
import { nanoid } from "nanoid"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"
import { ScrollArea } from "@repo/ui-shadcn/components/ui/scroll-area"
import { ChangeMode, TreeCollapseWidth } from "./constants"
import InputHeader from "./components/input-header/index.vue"
import InputTreeNode from "./components/input-tree-node/index.vue"
import { provideInputTreeContext } from "./context"
import type {
  InputTreeNodeValue,
  TreeNodeCustomData,
} from "./types"
import {
  buildNodeTestId,
  cleanTreeDataForOutput,
  convertObjectValueByChangeMode,
  createDefaultObjectLiteral,
  findCustomTreeNodeDataResult,
  formatTreeData,
  normalizeInputTreeValue,
} from "./utils"

type InputTreeValidationErrors = Record<string, string>

const props = withDefaults(defineProps<{
  testId?: string
  allowAppendRootData?: boolean
  isBatch?: boolean
  readonly?: boolean
  disabled?: boolean
  disabledTooltip?: string
  title?: string
  className?: string
  value?: InputTreeNodeValue[]
  topLevelReadonly?: boolean
  emptyPlaceholder?: string
  noCard?: boolean
  addItemTitle?: string
  defaultCollapse?: boolean
  formCardDefaultCollapse?: boolean
  maxLimit?: number
  columnsRatio?: string
  isNamePureText?: boolean
  defaultAppendValue?: (items: TreeNodeCustomData[]) => Partial<InputTreeNodeValue>
  nthCannotDeleted?: number
  disableDelete?: boolean
  validationErrors?: InputTreeValidationErrors
  showValidation?: boolean
}>(), {
  allowAppendRootData: true,
  isBatch: false,
  readonly: false,
  disabled: false,
  disabledTooltip: "",
  title: "输入参数",
  className: "",
  value: () => [],
  topLevelReadonly: false,
  emptyPlaceholder: "暂无输入参数",
  noCard: false,
  addItemTitle: "添加输入参数",
  defaultCollapse: false,
  formCardDefaultCollapse: false,
  maxLimit: undefined,
  columnsRatio: "4:6",
  isNamePureText: false,
  defaultAppendValue: undefined,
  nthCannotDeleted: 0,
  disableDelete: false,
  validationErrors: () => ({}),
  showValidation: true,
})

const emit = defineEmits<{
  (event: "update:value", value: InputTreeNodeValue[]): void
  (event: "change", value: InputTreeNodeValue[]): void
}>()

watch(
  () => props.testId,
  testId => provideInputTreeContext({ testId }),
  { immediate: true },
)

const cardExpanded = ref(!props.formCardDefaultCollapse)

const normalizedValue = computed(() => normalizeInputTreeValue(props.value))

const formattedResult = computed(() => formatTreeData(normalizedValue.value))
const formattedTreeData = computed(() => formattedResult.value.data)
const hasObject = computed(() => formattedResult.value.hasObject)
const itemKeysWithChildren = computed(() => formattedResult.value.itemKeysWithChildren)

const expandedKeys = ref<string[]>([])

function resetExpandedKeys(): void {
  if (props.defaultCollapse) {
    expandedKeys.value = []
    return
  }
  expandedKeys.value = [...new Set(itemKeysWithChildren.value)]
}

watch(
  () => [props.defaultCollapse, itemKeysWithChildren.value.join("|")],
  () => {
    resetExpandedKeys()
  },
  { immediate: true },
)

const isValueEmpty = computed(() => normalizedValue.value.length === 0)
const isDataEmpty = computed(() => formattedTreeData.value.length === 0)

const disableAdd = computed(() => {
  if (typeof props.maxLimit !== "number") {
    return false
  }
  return normalizedValue.value.length >= props.maxLimit
})

const showAddButton = computed(() => {
  return !props.readonly
    && !props.topLevelReadonly
    && props.allowAppendRootData
    && !disableAdd.value
})

const addRootButtonStyle = computed(() => {
  return {
    marginLeft: itemKeysWithChildren.value.length > 0 ? `${TreeCollapseWidth}px` : "0px",
  }
})

const validationErrors = computed(() => {
  return props.showValidation ? (props.validationErrors ?? {}) : {}
})

function getDefaultAppendValue(items: TreeNodeCustomData[]): InputTreeNodeValue {
  return {
    key: nanoid(),
    name: `input_${items.length + 1}`,
    type: "string",
    required: false,
    ...props.defaultAppendValue?.(items),
  }
}

function emitValue(nextTreeData: TreeNodeCustomData[] | InputTreeNodeValue[]): void {
  const cleaned = cleanTreeDataForOutput(nextTreeData)
  emit("update:value", cleaned)
  emit("change", cleaned)
}

function expandTreeNode(key: string): void {
  if (expandedKeys.value.includes(key)) {
    return
  }
  expandedKeys.value = [...expandedKeys.value, key]
}

function collapseTreeNode(key: string): void {
  expandedKeys.value = expandedKeys.value.filter(expandedKey => expandedKey !== key)
}

function onAddRoot(): void {
  const current = cleanTreeDataForOutput(formattedTreeData.value)
  const nextRootNode = getDefaultAppendValue(formattedTreeData.value)
  emitValue([...current, nextRootNode])
}

function onTreeNodeChange(mode: ChangeMode, param: TreeNodeCustomData): void {
  const cloneTreeData = formatTreeData(cleanTreeDataForOutput(formattedTreeData.value)).data
  const findResult = findCustomTreeNodeDataResult(cloneTreeData, param.field)

  if (!findResult) {
    return
  }

  switch (mode) {
    case ChangeMode.Append: {
      const { data } = findResult
      const currentChildren = data.children ?? []

      convertObjectValueByChangeMode(mode, data)
      const nextChildDraft = formatTreeData([
        getDefaultAppendValue(currentChildren),
      ]).data[0]

      if (!nextChildDraft) {
        return
      }

      data.children = [
        ...currentChildren,
        nextChildDraft,
      ]

      emitValue(cloneTreeData)
      expandTreeNode(data.key)
      break
    }

    case ChangeMode.Update: {
      const targetArray = findResult.isRoot
        ? cloneTreeData
        : findResult.parentData.children
      const index = targetArray?.findIndex(item => item.key === param.key) ?? -1
      if (index >= 0) {
        targetArray?.splice(index, 1, {
          ...targetArray[index],
          ...param,
          children: param.type === "object" ? param.children : undefined,
          input: param.type === "object"
            ? (param.input ?? createDefaultObjectLiteral())
            : param.input,
        })

        if (param.type !== "object") {
          targetArray?.[index] && (targetArray[index].children = undefined)
        }

        emitValue(cloneTreeData)
      }
      break
    }

    case ChangeMode.Delete: {
      if (findResult.isRoot) {
        emitValue(cloneTreeData.filter(item => item.key !== param.key))
        break
      }

      const parentData = findResult.parentData
      parentData.children = (parentData.children ?? []).filter(item => item.key !== param.key)
      convertObjectValueByChangeMode(mode, parentData)
      emitValue(cloneTreeData)
      break
    }

    case ChangeMode.DeleteChildren: {
      const { data } = findResult
      data.children = []
      if (!findResult.isRoot) {
        convertObjectValueByChangeMode(mode, data)
      }
      emitValue(cloneTreeData)
      break
    }

    default:
      break
  }
}

function onToggleNodeCollapse(payload: { key: string, expanded: boolean }): void {
  if (payload.expanded) {
    expandTreeNode(payload.key)
    return
  }
  collapseTreeNode(payload.key)
}

function isDeleteDisabled(node: TreeNodeCustomData): boolean {
  if (props.disableDelete) {
    return true
  }

  if (props.readonly || props.disabled) {
    return true
  }

  if (props.nthCannotDeleted === 0) {
    return false
  }

  const siblingCount = node.level === 0
    ? formattedTreeData.value.length
    : node.siblingCount

  return siblingCount < props.nthCannotDeleted + 1
}

const containerClass = computed(() => {
  return [
    "relative",
    "w-full",
    "rounded-[12px]",
    props.className,
  ]
})

const contentClass = computed(() => {
  return [
    "px-3 pb-3 pt-2",
    props.readonly ? "" : "overflow-visible",
  ]
})

const addButtonTestId = computed(() => buildNodeTestId(props.testId, "add-output-item"))

const emptyText = computed(() => {
  if (props.emptyPlaceholder) {
    return props.emptyPlaceholder
  }
  return "暂无输入参数"
})

const shouldRender = computed(() => {
  if (props.readonly && isValueEmpty.value) {
    return false
  }
  return true
})
</script>

<template>
  <div v-if="shouldRender" :class="containerClass">
    <template v-if="!noCard">
      <Card class="gap-0 rounded-[12px] border border-[#e2e7f2] bg-white py-0">
        <CardHeader
          class="flex flex-row items-center justify-between border-b border-[#eef2f9] px-4 py-3"
        >
          <CardTitle class="text-sm font-medium text-slate-800">
            {{ title }}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-slate-500"
            @click="cardExpanded = !cardExpanded"
          >
            <span class="text-[10px]">{{ cardExpanded ? "收起" : "展开" }}</span>
          </Button>
        </CardHeader>

        <CardContent v-show="cardExpanded" :class="contentClass">
          <InputHeader
            v-if="!isDataEmpty"
            :readonly="readonly"
            :config="{
              hasObject,
              hasCollapse: itemKeysWithChildren.length > 0,
            }"
            :columns-ratio="columnsRatio"
          />

          <ScrollArea class="max-h-[420px] w-full">
            <div class="space-y-1 pr-2">
              <InputTreeNode
                v-for="item in formattedTreeData"
                :key="item.key"
                :data="item"
                :level="item.level"
                :readonly="readonly"
                :on-change="onTreeNodeChange"
                :has-object="hasObject"
                :could-collapse="itemKeysWithChildren.length > 0"
                :expanded="expandedKeys.includes(item.key)"
                :expanded-keys="expandedKeys"
                :columns-ratio="columnsRatio"
                :is-name-pure-text="isNamePureText"
                :is-delete-disabled="isDeleteDisabled"
                :validation-errors="validationErrors"
                @toggle-collapse="onToggleNodeCollapse"
              />

              <p
                v-if="isDataEmpty"
                class="py-3 text-sm leading-6 text-slate-400"
              >
                {{ emptyText }}
              </p>
            </div>
          </ScrollArea>

          <Button
            v-if="showAddButton"
            variant="ghost"
            size="sm"
            class="mt-2 h-8 rounded-md border border-dashed border-[#d8deeb] text-[#4d53e8] hover:text-[#3b41da]"
            :style="addRootButtonStyle"
            :data-testid="addButtonTestId"
            :disabled="isBatch || disabled"
            @mousedown.prevent="onAddRoot"
          >
            <Plus class="size-4" />
            {{ addItemTitle }}
          </Button>
        </CardContent>
      </Card>
    </template>

    <template v-else>
      <div>
        <InputHeader
          v-if="!isDataEmpty"
          :readonly="readonly"
          :config="{
            hasObject,
            hasCollapse: itemKeysWithChildren.length > 0,
          }"
          :columns-ratio="columnsRatio"
        />

        <div class="space-y-1">
          <InputTreeNode
            v-for="item in formattedTreeData"
            :key="item.key"
            :data="item"
            :level="item.level"
            :readonly="readonly"
            :on-change="onTreeNodeChange"
            :has-object="hasObject"
            :could-collapse="itemKeysWithChildren.length > 0"
            :expanded="expandedKeys.includes(item.key)"
            :expanded-keys="expandedKeys"
            :columns-ratio="columnsRatio"
            :is-name-pure-text="isNamePureText"
            :is-delete-disabled="isDeleteDisabled"
            :validation-errors="validationErrors"
            @toggle-collapse="onToggleNodeCollapse"
          />

          <p
            v-if="isDataEmpty"
            class="py-3 text-sm leading-6 text-slate-400"
          >
            {{ emptyText }}
          </p>
        </div>

        <Button
          v-if="showAddButton"
          variant="ghost"
          size="sm"
          class="mt-2 h-8 rounded-md border border-dashed border-[#d8deeb] text-[#4d53e8] hover:text-[#3b41da]"
          :style="addRootButtonStyle"
          :data-testid="addButtonTestId"
          :disabled="isBatch || disabled"
          @mousedown.prevent="onAddRoot"
        >
          <Plus class="size-4" />
          {{ addItemTitle }}
        </Button>
      </div>
    </template>
  </div>
</template>
