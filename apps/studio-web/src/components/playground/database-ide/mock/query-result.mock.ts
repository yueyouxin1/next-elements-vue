export type QueryResultColumn = {
  key: string
  label: string
}

export type QueryResultSet = {
  columns: QueryResultColumn[]
  rows: Array<Record<string, string | number | null>>
  elapsedMs: number
  totalRows: number
}

export const defaultQueryResultMock: QueryResultSet = {
  columns: [
    { key: "id", label: "id" },
    { key: "email", label: "email" },
    { key: "created_at", label: "created_at" },
    { key: "status", label: "status" },
  ],
  rows: [
    { id: 1201, email: "alice@example.com", created_at: "2026-02-28 09:22:10", status: "active" },
    { id: 1198, email: "bob@example.com", created_at: "2026-02-28 08:58:01", status: "pending" },
    { id: 1191, email: "eve@example.com", created_at: "2026-02-27 21:30:44", status: "inactive" },
    { id: 1172, email: "lucy@example.com", created_at: "2026-02-27 14:03:12", status: "active" },
  ],
  elapsedMs: 38,
  totalRows: 4,
}

export const emptyQueryResultMock: QueryResultSet = {
  columns: [
    { key: "event_name", label: "event_name" },
    { key: "user_id", label: "user_id" },
  ],
  rows: [],
  elapsedMs: 21,
  totalRows: 0,
}

export const edgeQueryResultMock: QueryResultSet = {
  columns: [
    { key: "cohort_date", label: "cohort_date" },
    { key: "channel", label: "channel" },
    { key: "retention_d1", label: "retention_d1" },
    { key: "retention_d7", label: "retention_d7" },
    { key: "note", label: "note" },
  ],
  rows: [
    {
      cohort_date: "2026-02-01",
      channel: "Paid Search / Very Long Campaign Name For Edge Case",
      retention_d1: 0.6182,
      retention_d7: 0.2918,
      note: "包含超长文本以验证表格裁剪与悬浮行为",
    },
    {
      cohort_date: "2026-02-02",
      channel: "Organic",
      retention_d1: 0.7012,
      retention_d7: null,
      note: null,
    },
    {
      cohort_date: "2026-02-03",
      channel: "Email",
      retention_d1: 0,
      retention_d7: 0,
      note: "零值边界",
    },
  ],
  elapsedMs: 93,
  totalRows: 3,
}
