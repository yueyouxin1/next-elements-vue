<script setup lang="ts">
import { computed } from "vue"
import { ChevronRight, Database, FolderTree, Table2 } from "lucide-vue-next"
import type { SchemaTreeNode } from "./mock"

type FlatNode = {
  id: string
  label: string
  depth: number
  type: SchemaTreeNode["type"]
  expandable: boolean
}

const props = withDefaults(defineProps<{
  nodes: SchemaTreeNode[]
  selectedId: string
  expandedIds: string[]
  iconOnly?: boolean
}>(), {
  iconOnly: false,
})

const emit = defineEmits<{
  select: [id: string]
  toggle: [id: string]
}>()

const expandedSet = computed(() => new Set(props.expandedIds))

const flatNodes = computed<FlatNode[]>(() => {
  const result: FlatNode[] = []

  const walk = (items: SchemaTreeNode[], depth: number): void => {
    for (const item of items) {
      const expandable = Boolean(item.children?.length)
      result.push({
        id: item.id,
        label: item.label,
        depth,
        type: item.type,
        expandable,
      })

      if (expandable && expandedSet.value.has(item.id)) {
        walk(item.children ?? [], depth + 1)
      }
    }
  }

  walk(props.nodes, 0)
  return result
})

const tableNodes = computed(() =>
  flatNodes.value.filter(node => node.type === "table"),
)

function getIcon(type: SchemaTreeNode["type"]) {
  if (type === "database") return Database
  if (type === "schema") return FolderTree
  return Table2
}
</script>

<template>
  <div class="h-full border-r border-border bg-muted/30 text-[13px]">
    <div class="flex items-center justify-between border-b border-border px-3 py-2">
      <p class="font-medium">
        Schema
      </p>
      <span class="text-[11px] text-muted-foreground">
        {{ tableNodes.length }} tables
      </span>
    </div>

    <div v-if="iconOnly" class="group relative h-[calc(100%-41px)]">
      <div class="flex h-full flex-col items-center gap-2 px-2 py-2">
        <button
          v-for="item in tableNodes"
          :key="`icon-${item.id}`"
          type="button"
          class="flex size-8 items-center justify-center rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :class="item.id === selectedId ? 'bg-accent text-foreground' : ''"
          @click="emit('select', item.id)"
        >
          {{ item.label.slice(0, 1).toUpperCase() }}
        </button>
      </div>

      <div class="pointer-events-none absolute inset-y-0 left-full z-20 w-72 -translate-x-1 border border-border bg-background opacity-0 shadow-md transition-all duration-200 ease-linear group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100">
        <div class="h-full overflow-auto py-2">
          <div
            v-for="item in flatNodes"
            :key="`hover-${item.id}`"
            class="group/tree relative flex h-8 w-full items-center text-left transition-colors hover:bg-accent/70"
            :class="item.id === selectedId ? 'bg-accent text-foreground' : 'text-muted-foreground'"
            :style="{ paddingLeft: `${12 + item.depth * 12}px` }"
          >
            <span
              v-if="item.id === selectedId"
              class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary"
            />
            <button
              v-if="item.expandable"
              type="button"
              class="flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent"
              @click.stop="emit('toggle', item.id)"
            >
              <ChevronRight class="size-3 transition-transform duration-200" :class="expandedSet.has(item.id) ? 'rotate-90' : ''" />
            </button>
            <span v-else class="size-4" />
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-1.5 rounded-xs pr-2"
              @click="emit('select', item.id)"
            >
              <component :is="getIcon(item.type)" class="size-3.5 shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="h-[calc(100%-41px)] overflow-auto py-2">
      <div
        v-for="item in flatNodes"
        :key="item.id"
        class="group/tree relative flex h-8 w-full items-center text-left transition-colors hover:bg-accent/70"
        :class="item.id === selectedId ? 'bg-accent text-foreground' : 'text-muted-foreground'"
        :style="{ paddingLeft: `${12 + item.depth * 12}px` }"
      >
        <span
          v-if="item.id === selectedId"
          class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary"
        />
        <button
          v-if="item.expandable"
          type="button"
          class="flex size-4 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent"
          @click.stop="emit('toggle', item.id)"
        >
          <ChevronRight class="size-3 transition-transform duration-200" :class="expandedSet.has(item.id) ? 'rotate-90' : ''" />
        </button>
        <span v-else class="size-4" />
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-1.5 rounded-xs pr-2"
          @click="emit('select', item.id)"
        >
          <component :is="getIcon(item.type)" class="size-3.5 shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
