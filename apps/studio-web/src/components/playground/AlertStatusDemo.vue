<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@repo/ui-shadcn/components/ui/alert"
</script>

<template>
  <div class="space-y-4">
    <Alert>
      <AlertTitle>系统状态正常</AlertTitle>
      <AlertDescription>
        最近 15 分钟请求成功率 99.9%，所有核心服务均在线。
      </AlertDescription>
    </Alert>

    <Alert variant="destructive">
      <AlertTitle>需要处理的告警</AlertTitle>
      <AlertDescription>
        支付网关延迟升高，建议先切换到降级策略后再排查链路。
      </AlertDescription>
    </Alert>
  </div>
</template>
