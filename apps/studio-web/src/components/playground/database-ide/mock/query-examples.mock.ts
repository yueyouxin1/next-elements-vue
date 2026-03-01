export type QueryExample = {
  id: string
  label: string
  tableId: string
  sql: string
}

export const queryExamplesMock: QueryExample[] = [
  {
    id: "q-users-latest",
    label: "最新用户",
    tableId: "table-users",
    sql: "select id, email, created_at from users order by created_at desc limit 20;",
  },
  {
    id: "q-orders-summary",
    label: "订单汇总",
    tableId: "table-orders",
    sql: "select status, count(*) as total from orders group by status order by total desc;",
  },
  {
    id: "q-empty-result",
    label: "空结果演示",
    tableId: "table-events",
    sql: "select event_name, user_id from events where 1 = 0;",
  },
  {
    id: "q-illegal",
    label: "非法 SQL 演示",
    tableId: "table-users",
    sql: "select from users where ???;",
  },
  {
    id: "q-edge",
    label: "边界数据演示",
    tableId: "table-retention-cohort",
    sql: "select cohort_date, channel, retention_d1, retention_d7, note from retention_cohort limit 5;",
  },
]
