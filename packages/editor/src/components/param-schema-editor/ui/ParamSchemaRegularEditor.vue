<script setup lang="ts">
import type { SchemaEditorAction, SchemaEditorState, SchemaNode } from "../core";
import type { ParamSchemaRuntimeMode } from "./mode";
import type { VariableTreeNode } from "./tree-types";
import ParamSchemaEditorShell from "./ParamSchemaEditorShell.vue";

const props = withDefaults(
  defineProps<{
    state: SchemaEditorState;
    dispatch: (action: SchemaEditorAction) => void;
    canEdit?: (node: SchemaNode) => boolean;
    roleOptions?: string[];
    runtimeMode?: ParamSchemaRuntimeMode;
    valueRefTree?: VariableTreeNode[];
  }>(),
  {
    runtimeMode: "define",
    valueRefTree: () => [],
  },
);
</script>

<template>
  <ParamSchemaEditorShell v-bind="props" editor-kind="regular" />
</template>
