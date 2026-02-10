<script setup lang="ts">
import { computed, reactive, shallowReactive } from "vue"
import type { ActionRendererDefinition, FieldRendererDefinition, FormContext, FormGeneratorActionEvent, FormGeneratorExposed, FormModel, RegisterableActionRenderers, RegisterableFieldRenderers } from "./types"
import type { FormItem } from "./types/form-schema"
import { createActionRendererRegistry, createFieldRendererRegistry } from "./component-registry"
import { FormItemRenderer } from "./field-renderers"
import { normalizeFormItems } from "./utils"

const props = withDefaults(defineProps<{
  schema: FormItem[]
  modelValue?: FormModel
  context?: FormContext
  fieldRenderers?: RegisterableFieldRenderers
  actionRenderers?: RegisterableActionRenderers
}>(), {
  context: () => ({}),
})

const emit = defineEmits<{
  (event: "update:modelValue", payload: FormModel): void
  (event: "action", payload: FormGeneratorActionEvent): void
  (event: "error", payload: Error): void
  (event: string, payload?: unknown): void
}>()

const localModel = reactive<FormModel>({})
const localFieldRenderers = shallowReactive(new Map<string, FieldRendererDefinition>())
const localActionRenderers = shallowReactive(new Map<string, ActionRendererDefinition>())

const runtimeModel = computed<FormModel>(() => props.modelValue ?? localModel)

const normalizedSchema = computed<FormItem[]>(() => {
  try {
    return normalizeFormItems(props.schema ?? [])
  } catch (error) {
    emit("error", error as Error)
    return []
  }
})

const fieldRegistry = computed(() => {
  const registry = createFieldRendererRegistry(props.fieldRenderers)
  for (const [key, renderer] of localFieldRenderers.entries()) {
    registry.set(key.trim().toLowerCase(), renderer)
  }
  return registry
})

const actionRegistry = computed(() => {
  const registry = createActionRendererRegistry(props.actionRenderers)
  for (const [key, renderer] of localActionRenderers.entries()) {
    registry.set(key.trim().toLowerCase(), renderer)
  }
  return registry
})

function registerField(fieldType: string, renderer: FieldRendererDefinition): void {
  localFieldRenderers.set(fieldType.trim().toLowerCase(), renderer)
}

function unregisterField(fieldType: string): void {
  localFieldRenderers.delete(fieldType.trim().toLowerCase())
}

function registerAction(actionType: string, renderer: ActionRendererDefinition): void {
  localActionRenderers.set(actionType.trim().toLowerCase(), renderer)
}

function unregisterAction(actionType: string): void {
  localActionRenderers.delete(actionType.trim().toLowerCase())
}

function onModelChange(): void {
  emit("update:modelValue", runtimeModel.value)
}

function onAction(payload: FormGeneratorActionEvent): void {
  emit("action", payload)
}

function onEmitEvent(payload: { event: string, payload: unknown }): void {
  emit(payload.event, payload.payload)
}

function onError(error: Error): void {
  emit("error", error)
}

defineExpose<FormGeneratorExposed>({
  registerField,
  unregisterField,
  registerAction,
  unregisterAction,
})
</script>

<template>
  <div class="space-y-4">
    <FormItemRenderer
      v-for="item in normalizedSchema"
      :key="item.id"
      :item="item"
      :model="runtimeModel"
      :context="context"
      :field-registry="fieldRegistry"
      :action-registry="actionRegistry"
      @model-change="onModelChange"
      @action="onAction"
      @emit-event="onEmitEvent"
      @error="onError"
    />
  </div>
</template>

