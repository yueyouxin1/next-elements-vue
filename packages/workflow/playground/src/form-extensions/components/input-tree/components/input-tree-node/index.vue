<script setup lang="ts">
import { computed, ref } from "vue"
import { ChevronRight, Dot } from "lucide-vue-next"
import type { SchemaType } from "../../../../../../../src/base"
import { ChangeMode, TreeCollapseWidth } from "../../constants"
import { useColumnsStyle } from "../../hooks/use-columns-style"
import type {
  InputTreeNodeChangeHandler,
  TreeNodeCustomData,
} from "../../types"
import InputName from "../input-name/index.vue"
import InputOperator from "../input-operator/index.vue"
import InputValue from "../input-value/index.vue"

defineOptions({
  name: "InputTreeNode",
})

const props = withDefaults(defineProps<{
  data: TreeNodeCustomData
  level: number
  readonly?: boolean
  needRenderAppendChild?: boolean
  onChange: InputTreeNodeChangeHandler
  hasObject?: boolean
  couldCollapse?: boolean
  expanded?: boolean
  columnsRatio?: string
  isNamePureText?: boolean
  disabledTypes?: SchemaType[]
  isDeleteDisabled: (node: TreeNodeCustomData) => boolean
  validationErrors?: Record<string, string>
  expandedKeys: string[]
}>(), {
  readonly: false,
  needRenderAppendChild: true,
  hasObject: false,
  couldCollapse: true,
  expanded: true,
  columnsRatio: "4:6",
  isNamePureText: false,
  disabledTypes: () => [],
  isDeleteDisabled: () => false,
  validationErrors: () => ({}),
  expandedKeys: () => [],
})

const emit = defineEmits<{
  (event: "toggle-collapse", payload: { key: string, expanded: boolean }): void
}>()

const value = computed(() => props.data)

const columnsStyle = useColumnsStyle(
  () => props.columnsRatio,
  () => props.level,
)

const testName = computed(() => {
  return `/inputs/inputParameters${(props.data.field ?? "")
    .replace(/\./g, "/")
    .replace(/\[(\d+)\]/g, "/$1")}`
})

const nameRef = ref(value.value.name)
const typeRef = ref(value.value.type)

const hasChild = computed(() => (value.value.children?.length ?? 0) > 0)

const namePath = computed(() => `${value.value.field}.name`)
const inputPath = computed(() => `${value.value.field}.type`)

const hasNameError = computed(() => Boolean(props.validationErrors?.[namePath.value]))
const hasTypeError = computed(() => Boolean(props.validationErrors?.[inputPath.value]))

function onDelete(): void {
  props.onChange(ChangeMode.Delete, value.value)
}

function onAppend(): void {
  props.onChange(ChangeMode.Append, value.value)
}

function onNameChange(name: string): void {
  if (value.value.name === name) {
    return
  }

  nameRef.value = name
  props.onChange(ChangeMode.Update, {
    ...value.value,
    name,
    type: typeRef.value,
  })
}

function onValueChange(type: SchemaType): void {
  typeRef.value = type
  props.onChange(ChangeMode.Update, {
    ...value.value,
    type,
    name: nameRef.value,
  })
}

function onToggleCollapse(): void {
  if (!props.couldCollapse || !hasChild.value) {
    return
  }
  emit("toggle-collapse", {
    key: value.value.key,
    expanded: !props.expanded,
  })
}

const leadingOffset = computed(() => {
  return props.couldCollapse ? `${TreeCollapseWidth}px` : "0px"
})

const childContainerClass = computed(() => {
  return props.level === 0 ? "ml-[10px] border-l border-slate-200 pl-[8px]" : "ml-[10px] pl-[8px]"
})

const hasExpandedChildren = computed(() => {
  return hasChild.value && props.expanded
})
</script>

<template>
  <div class="relative flex items-center h-full">
    <div class="relative flex h-8 w-[10px] items-center justify-center">
      <button
        v-if="couldCollapse && hasChild"
        type="button"
        class="inline-flex size-4 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-100"
        :aria-label="expanded ? '收起子节点' : '展开子节点'"
        @click="onToggleCollapse"
      >
        <ChevronRight
          class="size-3.5 transition-transform"
          :class="expanded ? 'rotate-90' : ''"
        />
      </button>
      <Dot
        v-else
        class="size-4 text-slate-300"
      />
    </div>

    <div class="w-full" :style="{ paddingLeft: leadingOffset }">
      <div
        class="flex max-w-full flex-col rounded-[9px] px-1 py-1 transition-colors"
      >
        <div class="flex flex-1 items-center gap-1">
          <InputName
            :data="value"
            :disabled="readonly"
            :is-pure-text="isNamePureText"
            :style="columnsStyle.name"
            :error="hasNameError"
            :test-name="testName"
            @update="onNameChange"
          />

          <InputValue
            :data="value"
            :level="level"
            :disabled="readonly"
            :disabled-types="disabledTypes"
            :style="columnsStyle.value"
            :error="hasTypeError"
            :test-name="testName"
            @update="onValueChange"
          />

          <InputOperator
            v-if="!readonly"
            :data="value"
            :level="level"
            :has-object="hasObject"
            :need-render-append-child="needRenderAppendChild"
            :disable-delete="isDeleteDisabled(value)"
            @delete="onDelete"
            @append="onAppend"
          />
        </div>

        <p
          v-if="hasNameError"
          class="mt-1 text-[11px] leading-4 text-red-500"
        >
          {{ validationErrors?.[namePath] }}
        </p>
        <p
          v-else-if="hasTypeError"
          class="mt-1 text-[11px] leading-4 text-red-500"
        >
          {{ validationErrors?.[inputPath] }}
        </p>
      </div>

      <div
        v-if="hasExpandedChildren"
        class="space-y-1"
        :class="childContainerClass"
      >
        <InputTreeNode
          v-for="child in value.children"
          :key="child.key"
          :data="child"
          :level="child.level"
          :readonly="readonly"
          :need-render-append-child="needRenderAppendChild"
          :on-change="onChange"
          :has-object="hasObject"
          :could-collapse="couldCollapse"
          :expanded="expandedKeys.includes(child.key)"
          :expanded-keys="expandedKeys"
          :columns-ratio="columnsRatio"
          :is-name-pure-text="isNamePureText"
          :disabled-types="disabledTypes"
          :is-delete-disabled="isDeleteDisabled"
          :validation-errors="validationErrors"
          @toggle-collapse="payload => emit('toggle-collapse', payload)"
        />
      </div>
    </div>
  </div>
</template>
