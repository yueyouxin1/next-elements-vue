<script setup lang="ts">
import { AlertCircle, LoaderCircle } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui-shadcn/components/ui/alert"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@repo/ui-shadcn/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui-shadcn/components/ui/table"
import type { QueryErrorMock, QueryResultSet } from "./mock"

const props = defineProps<{
  runState: "idle" | "active" | "loading" | "success" | "error"
  result: QueryResultSet
  error: QueryErrorMock | null
}>()

function renderCell(value: string | number | null): string {
  if (value === null) return "NULL"
  return String(value)
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-background">
    <div class="flex items-center justify-between border-b border-border px-3 py-2">
      <p class="text-[13px] font-medium">
        Result Grid
      </p>
      <p class="text-[11px] text-muted-foreground">
        Rows: {{ result.totalRows }} | {{ result.elapsedMs }} ms
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-auto">
      <div v-if="runState === 'loading'" class="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle class="size-4 animate-spin" />
        查询执行中...
      </div>

      <div v-else-if="runState === 'error'" class="p-4">
        <Alert variant="destructive">
          <AlertCircle class="size-4" />
          <AlertTitle>{{ error?.message ?? "查询失败" }}</AlertTitle>
          <AlertDescription>
            {{ error?.detail ?? "请检查 SQL 或切换场景后重试。" }}
          </AlertDescription>
        </Alert>
      </div>

      <div v-else-if="result.rows.length === 0" class="p-4">
        <Empty class="border-border/70">
          <EmptyHeader>
            <EmptyTitle>无查询结果</EmptyTitle>
            <EmptyDescription>当前语句执行成功，但没有匹配记录。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent class="text-xs text-muted-foreground">
            尝试调整筛选条件，或切换到默认场景。
          </EmptyContent>
        </Empty>
      </div>

      <Table v-else class="min-w-full text-xs font-mono">
        <TableHeader class="bg-muted/80 sticky top-0 z-10 border-b border-border/70">
          <TableRow>
            <TableHead
              v-for="column in result.columns"
              :key="column.key"
              class="h-8 whitespace-nowrap text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              {{ column.label }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(row, rowIndex) in result.rows"
            :key="`row-${rowIndex}`"
            class="border-b border-border/50 transition-colors duration-75 ease-linear hover:bg-muted/50"
          >
            <TableCell
              v-for="column in result.columns"
              :key="`${rowIndex}-${column.key}`"
              class="h-8 max-w-[320px] truncate py-0 align-middle"
            >
              {{ renderCell(row[column.key] ?? null) }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
