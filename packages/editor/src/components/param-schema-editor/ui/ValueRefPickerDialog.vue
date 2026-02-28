<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@repo/ui-shadcn/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui-shadcn/components/ui/dialog";
import type { ValueRefContent } from "../core";
import type { VariableTreeNode } from "./tree-types";

const props = withDefaults(
  defineProps<{
    open: boolean;
    tree?: VariableTreeNode[];
    title?: string;
    description?: string;
  }>(),
  {
    tree: () => [],
    title: "Pick Variable",
    description: "Select a variable reference.",
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "select", value: ValueRefContent): void;
}>();

type Candidate = {
  key: string;
  label: string;
  blockID: string;
  path: string;
  source?: string;
};

const candidates = computed<Candidate[]>(() => {
  const list: Candidate[] = [];

  const walk = (
    nodes: VariableTreeNode[],
    labels: string[],
    inheritedBlockId: string,
  ) => {
    for (const node of nodes) {
      const rawLabel = node.label ?? node.name ?? node.title ?? node.path ?? node.id ?? "";
      const label = rawLabel.trim() || "variable";
      const currentLabels = [...labels, label];
      const blockID = (node.blockID ?? inheritedBlockId ?? node.id ?? "").trim();
      const path = (node.path ?? currentLabels.join(".")).trim();
      const source = node.source?.trim() || undefined;

      if (blockID && path) {
        list.push({
          key: `${blockID}:${path}:${source ?? ""}`,
          label: currentLabels.join(" / "),
          blockID,
          path,
          source,
        });
      }

      if (node.children?.length) {
        walk(node.children, currentLabels, blockID || inheritedBlockId);
      }
    }
  };

  walk(props.tree ?? [], [], "");
  const unique = new Map<string, Candidate>();
  for (const item of list) {
    if (!unique.has(item.key)) {
      unique.set(item.key, item);
    }
  }
  return [...unique.values()];
});

function onSelect(item: Candidate) {
  emit("select", {
    blockID: item.blockID,
    path: item.path,
    source: item.source,
  });
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <div class="max-h-[420px] space-y-2 overflow-auto">
        <div v-if="!candidates.length" class="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No variable candidates available.
        </div>
        <Button
          v-for="item in candidates"
          :key="item.key"
          type="button"
          variant="outline"
          class="h-auto w-full justify-start px-3 py-2 text-left"
          @click="onSelect(item)"
        >
          <div class="flex w-full flex-col gap-1">
            <span class="text-xs font-medium text-foreground">{{ item.label }}</span>
            <span class="font-mono text-[11px] text-muted-foreground">{{ item.blockID }} · {{ item.path }}</span>
          </div>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
