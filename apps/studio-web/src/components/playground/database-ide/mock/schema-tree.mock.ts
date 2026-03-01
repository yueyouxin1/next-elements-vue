export type SchemaNodeType = "database" | "schema" | "table"

export type SchemaTreeNode = {
  id: string
  label: string
  type: SchemaNodeType
  children?: SchemaTreeNode[]
}

export const schemaTreeMock: SchemaTreeNode[] = [
  {
    id: "db-analytics",
    label: "analytics",
    type: "database",
    children: [
      {
        id: "schema-public",
        label: "public",
        type: "schema",
        children: [
          { id: "table-users", label: "users", type: "table" },
          { id: "table-orders", label: "orders", type: "table" },
          { id: "table-events", label: "events", type: "table" },
        ],
      },
      {
        id: "schema-warehouse",
        label: "warehouse",
        type: "schema",
        children: [
          { id: "table-daily-metrics", label: "daily_metrics", type: "table" },
          { id: "table-retention-cohort", label: "retention_cohort", type: "table" },
        ],
      },
    ],
  },
]

export const defaultSelectedTableId = "table-users"
