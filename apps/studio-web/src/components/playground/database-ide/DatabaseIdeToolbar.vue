<script setup lang="ts">
import { LoaderCircle, Menu, PanelLeft, Play } from "lucide-vue-next"
import { Badge } from "@repo/ui-shadcn/components/ui/badge"
import { Button } from "@repo/ui-shadcn/components/ui/button"

const props = defineProps<{
  runState: "idle" | "active" | "loading" | "success" | "error"
  selectedTableLabel: string
  runPressed: boolean
  isMobile: boolean
  isTablet: boolean
  isSidebarCollapsed: boolean
}>()

const emit = defineEmits<{
  run: []
  "open-mobile-schema": []
  "toggle-sidebar": []
}>()

function badgeVariant() {
  if (props.runState === "error") return "destructive"
  if (props.runState === "success") return "default"
  return "secondary"
}

function badgeText() {
  if (props.runState === "loading") return "Loading"
  if (props.runState === "success") return "Success"
  if (props.runState === "error") return "Error"
  if (props.runState === "active") return "Active"
  return "Idle"
}
</script>

<template>
  <header class="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
    <Button
      v-if="isMobile"
      variant="ghost"
      size="icon"
      class="size-8"
      @click="emit('open-mobile-schema')"
    >
      <Menu class="size-4" />
    </Button>

    <Button
      v-if="isTablet"
      variant="ghost"
      size="icon"
      class="size-8"
      :aria-label="isSidebarCollapsed ? '展开侧栏' : '折叠侧栏'"
      @click="emit('toggle-sidebar')"
    >
      <PanelLeft class="size-4" />
    </Button>

    <p class="truncate text-[13px] font-medium">
      Database IDE
    </p>
    <span class="hidden text-xs text-muted-foreground sm:inline">Table: {{ selectedTableLabel }}</span>

    <div class="ml-auto flex items-center gap-2">
      <Badge :variant="badgeVariant()">
        {{ badgeText() }}
      </Badge>
      <Button
        size="sm"
        class="h-8 gap-1.5 text-xs transition-transform duration-100"
        :class="[
          runPressed ? 'scale-95' : 'scale-100',
          runState === 'loading' ? 'animate-pulse' : '',
        ]"
        :disabled="runState === 'loading'"
        @click="emit('run')"
      >
        <LoaderCircle v-if="runState === 'loading'" class="size-3.5 animate-spin" />
        <Play v-else class="size-3.5" />
        Run
      </Button>
    </div>
  </header>
</template>
