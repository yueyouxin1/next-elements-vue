export type QueryErrorMock = {
  code: string
  message: string
  detail: string
}

export const syntaxErrorMock: QueryErrorMock = {
  code: "42601",
  message: "SQL syntax error near \"???\"",
  detail: "请检查 SELECT 字段列表或 WHERE 条件表达式。",
}

export const emptyQueryErrorMock: QueryErrorMock = {
  code: "EMPTY_SQL",
  message: "查询语句不能为空",
  detail: "请输入 SQL 后再执行，或从示例中选择一条语句。",
}
