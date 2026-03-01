<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/ui-shadcn/components/ui/resizable"

defineProps<{
  isMobile: boolean
  isTablet: boolean
  isSidebarCollapsed: boolean
}>()
</script>

<template>
  <section class="h-[min(74vh,760px)] min-h-[520px] overflow-hidden rounded-lg border border-border bg-background">
    <div v-if="isMobile" class="grid h-full grid-rows-2">
      <div class="border-b border-border">
        <slot name="editor" />
      </div>
      <div>
        <slot name="result" />
      </div>
    </div>

    <ResizablePanelGroup
      v-else
      :key="`layout-${isTablet}-${isSidebarCollapsed}`"
      direction="horizontal"
      class="h-full w-full"
    >
      <ResizablePanel
        :default-size="isTablet ? (isSidebarCollapsed ? 8 : 24) : 22"
        :min-size="isTablet ? 6 : 16"
        :max-size="40"
      >
        <slot name="schema" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel :default-size="isTablet ? 92 : 78" :min-size="40">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="54" :min-size="30">
            <slot name="editor" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="46" :min-size="24">
            <slot name="result" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  </section>
</template>
