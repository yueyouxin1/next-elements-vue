const NUMBER_SEGMENT_RE = /^\d+$/

type PathSegment = string | number

export function tokenizeModelPath(path: string): PathSegment[] {
  if (!path || typeof path !== "string") {
    return []
  }

  const normalized = path
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/\[['"]([^'"]+)['"]\]/g, ".$1")
    .replace(/^\./, "")

  if (!normalized) {
    return []
  }

  return normalized
    .split(".")
    .filter(Boolean)
    .map((segment) => (NUMBER_SEGMENT_RE.test(segment) ? Number(segment) : segment))
}

export function getValueByModelPath(model: Record<string, any>, path: string): unknown {
  const segments = tokenizeModelPath(path)

  if (segments.length === 0) {
    return model
  }

  let cursor: any = model
  for (const segment of segments) {
    if (cursor === null || cursor === undefined) {
      return undefined
    }
    cursor = cursor[segment]
  }
  return cursor
}

export function setValueByModelPath(model: Record<string, any>, path: string, value: unknown): void {
  const segments = tokenizeModelPath(path)

  if (segments.length === 0) {
    return
  }

  let cursor: any = model
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    if (segment === undefined) {
      return
    }
    const isLast = index === segments.length - 1

    if (isLast) {
      cursor[segment] = value
      return
    }

    const nextSegment = segments[index + 1]
    const nextContainer = typeof nextSegment === "number" ? [] : {}

    if (
      cursor[segment] === null ||
      cursor[segment] === undefined ||
      typeof cursor[segment] !== "object"
    ) {
      cursor[segment] = nextContainer
    }

    cursor = cursor[segment]
  }
}
