<script setup lang="ts">
import { computed } from "vue"
import { Minus, Plus } from "lucide-vue-next"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui-shadcn/components/ui/tooltip"
import { MAX_TREE_LEVEL } from "../../constants"
import { useInputTreeContext } from "../../context"
import type { TreeNodeCustomData } from "../../types"
import { buildNodeTestId } from "../../utils"

const props = withDefaults(defineProps<{
  data: TreeNodeCustomData
  level: number
  hasObject?: boolean
  needRenderAppendChild?: boolean
  disableDelete: boolean
}>(), {
  hasObject: false,
  needRenderAppendChild: true,
})

const emit = defineEmits<{
  (event: "append"): void
  (event: "delete"): void
}>()

const { testId } = useInputTreeContext()

const isLimited = computed(() => props.level >= MAX_TREE_LEVEL)

const showAppendChild = computed(() => {
  return props.data.type === "object" && !isLimited.value && props.needRenderAppendChild
})

const addSubTestId = computed(() => {
  return buildNodeTestId(testId, props.data.field, "add-sub-param")
})

const removeTestId = computed(() => {
  return buildNodeTestId(testId, props.data.field, "remove-param")
})
</script>

<template>
  <div class="flex h-6 shrink-0 items-center justify-start self-stretch gap-1">
    <div v-if="hasObject" class="flex w-6 items-center justify-center text-[#4d53e8]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <div>
              <Button
                v-if="showAppendChild"
                variant="ghost"
                size="icon-sm"
                class="size-6 p-0 text-[#4d53e8] hover:text-[#3b41da]"
                :data-testid="addSubTestId"
                @click="emit('append')"
              >
                <Plus class="size-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            添加子参数
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <Button
      variant="ghost"
      size="icon-sm"
      class="size-6 p-0 text-slate-500 hover:text-slate-700"
      :data-testid="removeTestId"
      :disabled="disableDelete"
      @click="emit('delete')"
    >
      <Minus class="size-4" />
    </Button>
  </div>
</template>

