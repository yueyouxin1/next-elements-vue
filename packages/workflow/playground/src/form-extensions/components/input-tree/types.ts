import type { ParameterValue, SchemaType } from "../../../../../src/base"
import type { ChangeMode as TreeChangeMode } from "./constants"

export type InputTreeNodeValue = {
  key?: string
  name: string
  type: SchemaType
  required?: boolean
  input?: ParameterValue
  children?: InputTreeNodeValue[]
}

export type InputTreeNodeMeta = {
  field: string
  isFirst: boolean
  isLast: boolean
  isSingle: boolean
  level: number
  helpLineShow: boolean[]
  siblingCount: number
  parentField?: string
}

export type InputTreeNodeInputParameter = Pick<
  InputTreeNodeValue,
  "name" | "type" | "required" | "input"
>

export type TreeNodeCustomData = Omit<InputTreeNodeValue, "children" | "key">
  & InputTreeNodeMeta
  & {
    key: string
    children?: TreeNodeCustomData[]
    inputParameters?: InputTreeNodeInputParameter[]
  }

interface RootFindResult {
  isRoot: true
  data: TreeNodeCustomData
  parentData: null
}

interface ChildrenFindResult {
  isRoot: false
  parentData: TreeNodeCustomData
  data: TreeNodeCustomData
}

export type FindDataResult = RootFindResult | ChildrenFindResult | null

export type InputTreeNodeChangeHandler = (
  mode: TreeChangeMode,
  param: TreeNodeCustomData,
) => void
