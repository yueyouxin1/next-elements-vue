export const TreeIndentWidth = 15
export const TreeCollapseWidth = 10

export const ChangeMode = {
  Update: "Update",
  Delete: "Delete",
  Append: "Append",
  DeleteChildren: "DeleteChildren",
} as const

export type ChangeMode = (typeof ChangeMode)[keyof typeof ChangeMode]

export const MAX_TREE_LEVEL = 3
