import { nanoid } from "nanoid"
import type { ParameterValue } from "../../../../../src/base"
import { ChangeMode } from "./constants"
import type {
  FindDataResult,
  InputTreeNodeValue,
  TreeNodeCustomData,
} from "./types"

const MAX_LINE_LEVEL = 2

export function normalizeInputTreeNodeValue(
  value: InputTreeNodeValue,
): InputTreeNodeValue {
  return {
    key: value.key,
    name: value.name,
    type: value.type,
    required: value.required,
    input: value.input,
    children: value.children?.map(item => normalizeInputTreeNodeValue(item)),
  }
}

export function normalizeInputTreeValue(
  value: InputTreeNodeValue[] | undefined,
): InputTreeNodeValue[] {
  return (value ?? []).map(item => normalizeInputTreeNodeValue(item))
}

export function formatTreeData(data: InputTreeNodeValue[]): {
  data: TreeNodeCustomData[]
  hasObject: boolean
  itemKeysWithChildren: string[]
} {
  const cloned = normalizeInputTreeValue(data)
  let hasObject = false
  const itemKeysWithChildren: string[] = []

  const resolveActionParamList = (
    list: InputTreeNodeValue[],
    field: string,
    { parentData, level }: { parentData?: TreeNodeCustomData, level: number },
  ): TreeNodeCustomData[] => {
    const items = list ?? []
    const inputParameters = items.map(item => ({
      name: item.name,
      type: item.type,
      required: item.required,
      input: item.input,
    }))

    return items.map((item, index) => {
      const keyField = `${field}[${index}]`
      const key = item.key ?? nanoid()
      const hasChildren = (item.children?.length ?? 0) > 0
      const childList = hasChildren
        ? resolveActionParamList(item.children ?? [], `${keyField}.children`, {
            parentData: {
              ...(item as TreeNodeCustomData),
              key,
              field: keyField,
              isFirst: index === 0,
              isLast: index === items.length - 1,
              isSingle: items.length === 1,
              level,
              siblingCount: items.length,
              helpLineShow:
                parentData && level >= MAX_LINE_LEVEL
                  ? (parentData.helpLineShow ?? []).concat(!parentData.isLast)
                  : [],
              parentField: parentData?.field,
            },
            level: level + 1,
          })
        : undefined

      const node: TreeNodeCustomData = {
        ...item,
        key,
        field: keyField,
        inputParameters,
        isFirst: index === 0,
        isLast: index === items.length - 1,
        isSingle: items.length === 1,
        level,
        siblingCount: items.length,
        helpLineShow:
          parentData && level >= MAX_LINE_LEVEL
            ? (parentData.helpLineShow ?? []).concat(!parentData.isLast)
            : [],
        parentField: parentData?.field,
        children: childList,
      }

      if (isObjectTreeNode(node)) {
        hasObject = true
      }
      if (hasChildren) {
        itemKeysWithChildren.push(node.key)
      }

      return node
    })
  }

  const formatted = resolveActionParamList(cloned, "", { level: 0 })

  return {
    data: formatted,
    hasObject,
    itemKeysWithChildren,
  }
}

export function findCustomTreeNodeDataResult(
  target: TreeNodeCustomData[],
  findField: string,
): FindDataResult {
  const dataInRoot = target.find(item => item.field === findField)
  if (dataInRoot) {
    return {
      isRoot: true,
      parentData: null,
      data: dataInRoot,
    }
  }

  const findDataInChildrenLoop = (
    children: TreeNodeCustomData[],
    parentData?: TreeNodeCustomData,
  ): FindDataResult => {
    for (const child of children) {
      if (child.field === findField) {
        return {
          isRoot: false,
          parentData: parentData ?? child,
          data: child,
        }
      }

      if ((child.children?.length ?? 0) > 0) {
        const childResult = findDataInChildrenLoop(child.children ?? [], child)
        if (childResult) {
          return childResult
        }
      }
    }
    return null
  }

  return findDataInChildrenLoop(target)
}

export function traverse<T extends { children?: T[] }>(
  nodeOrNodes: T | T[],
  action: (node: T) => void,
): void {
  const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes]
  for (const node of nodes) {
    action(node)
    if ((node.children?.length ?? 0) > 0) {
      traverse(node.children ?? [], action)
    }
  }
}

export function isObjectTreeNode(item?: Pick<InputTreeNodeValue, "type">): boolean {
  return item?.type === "object"
}

export function createDefaultObjectLiteral(): ParameterValue {
  return {
    type: "literal",
    content: {},
  }
}

export function createObjectRefValue(): ParameterValue {
  return {
    type: "ref",
    content: {
      blockID: "$self",
      path: "*",
      source: "object-ref",
    },
  }
}

export function convertObjectValueByChangeMode(
  mode: ChangeMode,
  node: TreeNodeCustomData,
): void {
  if (!isObjectTreeNode(node)) {
    return
  }

  if (mode === ChangeMode.Append) {
    if ((node.children?.length ?? 0) === 0 && node.input?.type !== "ref") {
      node.input = createObjectRefValue()
    }
    return
  }

  if (mode === ChangeMode.Delete || mode === ChangeMode.DeleteChildren) {
    if ((node.children?.length ?? 0) === 0 && node.input?.type !== "ref") {
      node.input = createDefaultObjectLiteral()
    }
  }
}

function cleanInputValue(value?: ParameterValue): ParameterValue | undefined {
  if (!value) {
    return undefined
  }
  if (value.type === "literal") {
    return {
      type: "literal",
      content: value.content,
    }
  }
  if (value.type === "expr") {
    return {
      type: "expr",
      content: value.content,
    }
  }

  return {
    type: "ref",
    content: {
      blockID: value.content.blockID,
      path: value.content.path,
      source: value.content.source,
    },
  }
}

export function cleanTreeDataForOutput(
  list: TreeNodeCustomData[] | InputTreeNodeValue[],
): InputTreeNodeValue[] {
  return (list ?? []).map(item => {
    const cleanNode: InputTreeNodeValue = {
      key: item.key,
      name: item.name,
      type: item.type,
      required: item.required,
      input: cleanInputValue(item.input),
    }

    if ((item.children?.length ?? 0) > 0) {
      cleanNode.children = cleanTreeDataForOutput(item.children ?? [])
    }

    return cleanNode
  })
}

export function buildNodeTestId(base: string | undefined, ...parts: string[]): string {
  return [base, ...parts]
    .filter(item => Boolean(item))
    .map(item => String(item))
    .join("/")
}
