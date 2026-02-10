<script setup lang="ts">
import { computed, watchEffect } from "vue"
import { Label } from "@repo/ui-shadcn/components/ui/label"
import type {
  ActionRendererDefinition,
  ExpressionRuntimeScope,
  FieldOption,
  FieldRendererDefinition,
  FormGeneratorActionEvent,
  FormContext,
  FormModel,
} from "../types"
import type {
  Expr,
  FormActionItem,
  FormFieldItem,
  FormItem,
} from "../types/form-schema"
import {
  createExpressionScope,
  evaluateExpression,
  getValueByModelPath,
  resolveDynamicValue,
  setValueByModelPath,
} from "../utils"
import { resolveActionRenderer, resolveFieldRenderer } from "../component-registry"

const props = withDefaults(defineProps<{
  item: FormItem
  model: FormModel
  context?: FormContext
  fieldRegistry: Map<string, FieldRendererDefinition>
  actionRegistry: Map<string, ActionRendererDefinition>
}>(), {
  context: () => ({}),
})

const emit = defineEmits<{
  (event: "action", payload: FormGeneratorActionEvent): void
  (event: "emit-event", payload: { event: string, payload: unknown }): void
  (event: "model-change"): void
  (event: "error", payload: Error): void
}>()

function getExpressionScope(overrides?: Partial<ExpressionRuntimeScope>) {
  return createExpressionScope({
    model: props.model,
    context: props.context,
    item: props.item,
    value: getFieldValue(),
    overrides,
  })
}

function evaluateExpr<T>(
  expr: Expr<T> | undefined,
  fallback?: T,
  overrides?: Partial<ExpressionRuntimeScope>,
): T | undefined {
  return evaluateExpression(expr, getExpressionScope(overrides), fallback)
}

function resolveDynamic<T>(value: T, overrides?: Partial<ExpressionRuntimeScope>): T {
  return resolveDynamicValue(value, getExpressionScope(overrides))
}

function getFieldItem(): FormFieldItem | undefined {
  if (props.item.type !== "form") {
    return undefined
  }
  return props.item
}

function getActionItem(): FormActionItem | undefined {
  if (props.item.type !== "action") {
    return undefined
  }
  return props.item
}

function getFieldValue(): unknown {
  const item = getFieldItem()
  if (!item) {
    return undefined
  }
  return getValueByModelPath(props.model, item.modelPath)
}

function setFieldValue(next: unknown): void {
  const item = getFieldItem()
  if (!item) {
    return
  }
  setValueByModelPath(props.model, item.modelPath, next)
  emit("model-change")
}

function normalizeOptions(rawOptions: unknown): FieldOption[] {
  if (!Array.isArray(rawOptions)) {
    return []
  }

  return rawOptions.map((option) => {
    if (option && typeof option === "object") {
      const candidate = option as Record<string, unknown>
      return {
        label: candidate.label ? String(candidate.label) : undefined,
        value: candidate.value,
        disabled: Boolean(candidate.disabled),
        ...candidate,
      }
    }
    return {
      label: String(option),
      value: option,
      disabled: false,
    }
  })
}

const fieldItem = computed(() => getFieldItem())
const actionItem = computed(() => getActionItem())

const isVisible = computed(() => {
  const value = evaluateExpr(props.item.state?.visible, true)
  return value !== false
})

const isDisabled = computed(() => {
  const value = evaluateExpr(props.item.state?.disabled, false)
  return value === true
})

const containerClass = computed(() => props.item.ui?.className)
const containerStyle = computed<Record<string, string | number>>(() => {
  const baseStyle = props.item.ui?.style ?? {}
  if (props.item.ui?.width === undefined) {
    return baseStyle
  }
  return {
    ...baseStyle,
    width: props.item.ui.width,
  }
})

const fieldRenderer = computed(() => {
  const item = fieldItem.value
  if (!item) {
    return undefined
  }
  return resolveFieldRenderer(props.fieldRegistry, item.control)
})

const fieldOptions = computed(() => {
  const item = fieldItem.value
  if (!item) {
    return []
  }
  const resolvedProps = resolveDynamic(item.props ?? {})
  const rawOptions = (resolvedProps as Record<string, unknown>).options
  return normalizeOptions(rawOptions)
})

const fieldRequired = computed(() => {
  const item = fieldItem.value
  if (!item) {
    return false
  }
  if (item.required === true) {
    return true
  }
  return evaluateExpr(item.requiredWhen, false) === true
})

const fieldChildren = computed(() => {
  const item = fieldItem.value
  if (!item?.children?.length) {
    return []
  }
  return [...item.children].sort((left, right) => (left.ui?.order ?? 0) - (right.ui?.order ?? 0))
})

function getFieldResolveContext() {
  const item = fieldItem.value
  if (!item) {
    return undefined
  }
  return {
    item,
    model: props.model,
    context: props.context,
    value: getFieldValue(),
    setValue: setFieldValue,
    options: fieldOptions.value,
    evaluateExpr,
    resolveDynamic,
  }
}

const fieldModelProp = computed(() => fieldRenderer.value?.modelProp ?? "modelValue")
const fieldModelEvent = computed(() => fieldRenderer.value?.modelEvent ?? "update:modelValue")

const fieldComponentProps = computed(() => {
  const item = fieldItem.value
  const renderer = fieldRenderer.value
  const context = getFieldResolveContext()

  if (!item || !renderer || !context) {
    return {}
  }

  const mappedProps = renderer.getProps?.(context) ?? {
    fieldProps: resolveDynamic(item.props ?? {}),
    options: fieldOptions.value,
  }

  const valueForComponent = renderer.transformInput
    ? renderer.transformInput(getFieldValue(), context)
    : getFieldValue()

  return {
    ...mappedProps,
    disabled: isDisabled.value,
    [fieldModelProp.value]: valueForComponent,
  }
})

function onFieldModelUpdate(nextValue: unknown): void {
  try {
    const renderer = fieldRenderer.value
    const context = getFieldResolveContext()
    if (!renderer || !context) {
      return
    }
    const outputValue = renderer.transformOutput
      ? renderer.transformOutput(nextValue, context)
      : nextValue
    setFieldValue(outputValue)
  } catch (error) {
    emit("error", error as Error)
  }
}

const fieldListeners = computed<Record<string, (value: unknown) => void>>(() => ({
  [fieldModelEvent.value]: onFieldModelUpdate,
}))

watchEffect(() => {
  const item = fieldItem.value
  if (!item) {
    return
  }

  const current = getFieldValue()
  if (current !== undefined && current !== null) {
    return
  }

  const defaultValue = evaluateExpr(
    (item.props?.defaultValue as Expr<unknown> | undefined),
    undefined,
  )

  if (defaultValue !== undefined) {
    setFieldValue(defaultValue)
  }
})

const actionRenderer = computed(() => {
  const item = actionItem.value
  if (!item) {
    return undefined
  }
  return resolveActionRenderer(props.actionRegistry, item.actionType)
})

const actionEventName = computed(() => actionRenderer.value?.eventName ?? "click")

function getActionResolveContext() {
  const item = actionItem.value
  if (!item) {
    return undefined
  }
  return {
    item,
    model: props.model,
    context: props.context,
    evaluateExpr,
    resolveDynamic,
  }
}

const actionComponentProps = computed(() => {
  const item = actionItem.value
  const renderer = actionRenderer.value
  const context = getActionResolveContext()

  if (!item || !renderer || !context) {
    return {}
  }

  return renderer.getProps?.(context) ?? {
    label: item.label,
    disabled: isDisabled.value,
    actionProps: resolveDynamic(item.props ?? {}),
  }
})

function resolveActionPayload(item: FormActionItem): unknown {
  if (!item.on) {
    return undefined
  }

  if (item.on.kind === "emit") {
    return evaluateExpr(item.on.payload)
  }

  if (item.on.kind === "callback") {
    return evaluateExpr(item.on.payload)
  }

  if (item.on.kind === "navigate") {
    return {
      to: item.on.to,
      params: evaluateExpr(item.on.params),
    }
  }

  if (item.on.kind === "api") {
    return {
      apiName: item.on.apiName,
      body: evaluateExpr(item.on.body),
    }
  }

  return undefined
}

function onActionTrigger(): void {
  const item = actionItem.value
  if (!item) {
    return
  }

  try {
    const payload = resolveActionPayload(item)
    if (item.on?.kind === "emit") {
      emit("emit-event", {
        event: item.on.event,
        payload,
      })
    }

    if (item.on?.kind === "callback") {
      const callback = props.context?.[item.on.fn]
      if (typeof callback === "function") {
        callback(payload, {
          item,
          model: props.model,
          context: props.context,
        })
      }
    }

    emit("action", {
      item,
      payload,
    })
  } catch (error) {
    emit("error", error as Error)
  }
}

const actionListeners = computed<Record<string, () => void>>(() => ({
  [actionEventName.value]: onActionTrigger,
}))
</script>

<template>
  <div v-if="isVisible" :class="['space-y-2', containerClass]" :style="containerStyle">
    <template v-if="fieldItem">
      <Label v-if="fieldItem.label" class="text-sm font-medium">
        {{ fieldItem.label }}
        <span v-if="fieldRequired" class="text-destructive">*</span>
      </Label>

      <component
        :is="fieldRenderer?.component"
        v-bind="fieldComponentProps"
        v-on="fieldListeners"
      />

      <p v-if="fieldItem.desc" class="text-xs text-muted-foreground">
        {{ fieldItem.desc }}
      </p>

      <div v-if="fieldChildren.length" class="space-y-3 border-l pl-4">
        <FormItemRenderer
          v-for="child in fieldChildren"
          :key="child.id"
          :item="child"
          :model="model"
          :context="context"
          :field-registry="fieldRegistry"
          :action-registry="actionRegistry"
          @action="emit('action', $event)"
          @emit-event="emit('emit-event', $event)"
          @model-change="emit('model-change')"
          @error="emit('error', $event)"
        />
      </div>
    </template>

    <template v-else-if="actionItem">
      <component
        :is="actionRenderer?.component"
        v-bind="actionComponentProps"
        v-on="actionListeners"
      />
      <p v-if="actionItem.desc" class="text-xs text-muted-foreground">
        {{ actionItem.desc }}
      </p>
    </template>
  </div>
</template>
