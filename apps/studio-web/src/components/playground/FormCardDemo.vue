<script setup lang="ts">
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { Input } from "@repo/ui-shadcn/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"
</script>

<template>
  <Card class="max-w-lg">
    <CardHeader>
      <CardTitle>订阅更新</CardTitle>
      <CardDescription>用于测试 Input + Card + Button 组合样式。</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <Input placeholder="请输入邮箱地址" type="email" />
      <Input placeholder="请输入姓名" />
    </CardContent>
    <CardFooter class="justify-end">
      <Button>提交</Button>
    </CardFooter>
  </Card>
</template>
