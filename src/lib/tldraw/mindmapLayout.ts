// 마인드맵 자동 레이아웃 — 연결된 shape + arrow를 트리 구조로 재배치
import type { Editor, TLArrowShape, TLShapeId } from 'tldraw'
import { getArrowBindings } from 'tldraw'

const H_SPACING = 280
const V_SPACING = 160

type TreeNode = {
  id: TLShapeId
  children: TreeNode[]
}

function buildAdjacency(editor: Editor, arrowShapes: TLArrowShape[]): Map<string, string[]> {
  const adj = new Map<string, string[]>()
  for (const arrow of arrowShapes) {
    const bindings = getArrowBindings(editor, arrow)
    const from = bindings.start?.toId
    const to = bindings.end?.toId
    if (!from || !to) continue
    if (!adj.has(from)) adj.set(from, [])
    adj.get(from)!.push(to)
  }
  return adj
}

function findRoots(shapeIds: string[], adj: Map<string, string[]>): string[] {
  const hasIncoming = new Set<string>()
  for (const [, children] of adj) {
    for (const c of children) hasIncoming.add(c)
  }
  const roots = shapeIds.filter((id) => !hasIncoming.has(id) && adj.has(id))
  return roots.length > 0 ? roots : shapeIds.slice(0, 1)
}

function buildTree(
  rootId: string,
  adj: Map<string, string[]>,
  visited = new Set<string>()
): TreeNode {
  visited.add(rootId)
  const childIds = adj.get(rootId) ?? []
  const children = childIds
    .filter((id) => !visited.has(id))
    .map((id) => buildTree(id, adj, visited))
  return { id: rootId as TLShapeId, children }
}

function countLeaves(node: TreeNode): number {
  if (node.children.length === 0) return 1
  return node.children.reduce((s, c) => s + countLeaves(c), 0)
}

function assignPositions(
  node: TreeNode,
  x: number,
  yOffset: number,
  positions: Map<string, { x: number; y: number }>
) {
  positions.set(node.id, { x, y: yOffset })
  let currentY = yOffset
  for (const child of node.children) {
    const leaves = countLeaves(child)
    const childCenter = currentY + ((leaves - 1) * V_SPACING) / 2
    assignPositions(child, x + H_SPACING, childCenter, positions)
    currentY += leaves * V_SPACING
  }
}

export function applyMindmapLayout(editor: Editor): boolean {
  const shapes = editor.getCurrentPageShapes()
  const arrowShapes = shapes.filter((s): s is TLArrowShape => s.type === 'arrow')

  if (arrowShapes.length === 0) return false

  const connectedIds = new Set<string>()
  for (const arrow of arrowShapes) {
    const bindings = getArrowBindings(editor, arrow)
    if (bindings.start?.toId) connectedIds.add(bindings.start.toId)
    if (bindings.end?.toId) connectedIds.add(bindings.end.toId)
  }

  const nonArrowIds = shapes
    .filter((s) => s.type !== 'arrow' && connectedIds.has(s.id))
    .map((s) => s.id)

  if (nonArrowIds.length === 0) return false

  const adj = buildAdjacency(editor, arrowShapes)
  const roots = findRoots(nonArrowIds, adj)

  const positions = new Map<string, { x: number; y: number }>()
  let yStart = 0

  for (const rootId of roots) {
    const tree = buildTree(rootId, adj)
    const leaves = countLeaves(tree)
    assignPositions(tree, 0, yStart, positions)
    yStart += leaves * V_SPACING + V_SPACING
  }

  const updates = nonArrowIds
    .filter((id) => positions.has(id))
    .map((id) => {
      const pos = positions.get(id)!
      const shape = shapes.find((s) => s.id === id)!
      return { id, type: shape.type, x: pos.x, y: pos.y }
    })

  if (updates.length > 0) {
    editor.updateShapes(updates)
    editor.zoomToFit()
    return true
  }
  return false
}
