<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ParamSchemaProfessionalEditor,
  ParamSchemaRegularEditor,
  type ParamSchemaRuntimeMode,
  type VariableTreeNode,
  useParamSchemaEditor,
} from "@repo/editor";
import { Button } from "@repo/ui-shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card";
type EditorKind = "regular" | "professional";

const activeEditorKind = ref<EditorKind>("regular");
const runtimeMode = ref<ParamSchemaRuntimeMode>("define");

const regularEditor = useParamSchemaEditor();
const professionalEditor = useParamSchemaEditor();

const roleOptions = ["system", "input", "output"];

const valueRefTree: VariableTreeNode[] = [
  {
    id: "start",
    label: "start",
    blockID: "start",
    children: [
      { id: "start.user.id", label: "user.id", path: "user.id" },
      { id: "start.user.name", label: "user.name", path: "user.name" },
      { id: "start.ctx.locale", label: "ctx.locale", path: "ctx.locale" },
    ],
  },
  {
    id: "llm",
    label: "llm",
    blockID: "llm",
    children: [
      { id: "llm.output.text", label: "output.text", path: "output.text" },
      { id: "llm.output.tokens", label: "output.tokens", path: "output.tokens" },
    ],
  },
];

const runtimeModes: ParamSchemaRuntimeMode[] = ["define", "refine", "bind", "default", "read"];

const activeEditorComponent = computed(() =>
  activeEditorKind.value === "regular" ? ParamSchemaRegularEditor : ParamSchemaProfessionalEditor,
);

const activeState = computed(() =>
  activeEditorKind.value === "regular" ? regularEditor.state.value : professionalEditor.state.value,
);

const activeDispatch = computed(() =>
  activeEditorKind.value === "regular" ? regularEditor.dispatch : professionalEditor.dispatch,
);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Param Schema Editors</CardTitle>
      <CardDescription>
        Regular / Professional 已拆分为独立组件，支持 define/refine/bind/default/read 运行态权限。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          :variant="activeEditorKind === 'regular' ? 'default' : 'outline'"
          @click="activeEditorKind = 'regular'"
        >
          Regular Editor
        </Button>
        <Button
          type="button"
          size="sm"
          :variant="activeEditorKind === 'professional' ? 'default' : 'outline'"
          @click="activeEditorKind = 'professional'"
        >
          Professional Editor
        </Button>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          v-for="mode in runtimeModes"
          :key="mode"
          type="button"
          size="sm"
          :variant="runtimeMode === mode ? 'secondary' : 'outline'"
          @click="runtimeMode = mode"
        >
          {{ mode }}
        </Button>
      </div>

      <div class="rounded-md border bg-muted/30 p-3 text-xs leading-6">
        <p class="font-medium">检查点</p>
        <p>1. 切换 editor 不会相互污染状态，两个组件可独立消费。</p>
        <p>2. 切换 runtime mode 后，字段/结构编辑权限会按模式变化。</p>
        <p>3. 支持导入导出、undo/redo、节点结构编辑与详情联动。</p>
      </div>

      <component
        :is="activeEditorComponent"
        :state="activeState"
        :dispatch="activeDispatch"
        :runtime-mode="runtimeMode"
        :role-options="roleOptions"
        :value-ref-tree="valueRefTree"
        class="h-[640px] min-h-0"
      />
    </CardContent>
  </Card>
</template>
