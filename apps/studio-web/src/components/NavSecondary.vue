<script setup lang="ts">
import type { Component } from "vue"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui-shadcn/components/ui/sidebar'

interface NavItem {
  title: string
  url: string
  icon?: Component
}

defineProps<{
  items: NavItem[]
}>()

const emit = defineEmits<{
  (e: 'open-settings'): void
}>()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem
          v-for="item in items"
          :key="item.title"
        >
          <SidebarMenuButton
            v-if="item.title === 'Settings'"
            @click="emit('open-settings')"
          >
            <component :is="item.icon" v-if="item.icon" />
            {{ item.title }}
          </SidebarMenuButton>
          <SidebarMenuButton v-else as-child>
            <a :href="item.url">
              <component :is="item.icon" v-if="item.icon" />
              {{ item.title }}
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
