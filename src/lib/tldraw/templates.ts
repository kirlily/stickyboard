// 보드 템플릿 정의 — 회고, 브레인스토밍, 칸반
import type { Editor } from 'tldraw'
import { createStickyNote } from './stickyNoteShape'
import type { StickyColor } from './stickyNoteShape'

export type TemplateName = 'retro' | 'brainstorm' | 'kanban'

export const TEMPLATE_META: Record<TemplateName, { label: string; description: string }> = {
  retro: { label: '회고', description: '잘한 점 / 개선할 점 / 시도할 것 / 감사한 것' },
  brainstorm: { label: '브레인스토밍', description: '중심 주제 + 아이디어 6개' },
  kanban: { label: '칸반', description: 'To Do / In Progress / Done' },
}

function createRetroShapes() {
  const quadrants: Array<{ x: number; y: number; text: string; color: StickyColor }> = [
    { x: 0, y: 0, text: '잘한 점 ✅', color: 'green' },
    { x: 320, y: 0, text: '개선할 점 🔧', color: 'red' },
    { x: 0, y: 320, text: '시도해볼 것 💡', color: 'blue' },
    { x: 320, y: 320, text: '감사할 것 🙏', color: 'yellow' },
  ]
  return quadrants.map(({ x, y, text, color }) =>
    createStickyNote({ x, y, text, color, w: 280, h: 280 })
  )
}

function createBrainstormShapes() {
  const radius = 300
  const centerShape = createStickyNote({
    x: 120,
    y: 100,
    text: '중심 주제',
    color: 'orange',
    w: 240,
    h: 200,
  })

  const labels = [
    '아이디어 1',
    '아이디어 2',
    '아이디어 3',
    '아이디어 4',
    '아이디어 5',
    '아이디어 6',
  ]
  const colors: StickyColor[] = ['yellow', 'cyan', 'pink', 'lime', 'purple', 'teal']

  const surroundingShapes = labels.map((text, i) => {
    const angle = (i * Math.PI * 2) / labels.length - Math.PI / 2
    const cx = 120 + 240 / 2
    const cy = 100 + 200 / 2
    const x = Math.round(cx + Math.cos(angle) * radius) - 90
    const y = Math.round(cy + Math.sin(angle) * radius) - 75
    return createStickyNote({ x, y, text, color: colors[i] ?? 'yellow', w: 180, h: 150 })
  })

  return [centerShape, ...surroundingShapes]
}

function createKanbanShapes() {
  const columns: Array<{ title: string; color: StickyColor; x: number }> = [
    { title: 'To Do 📋', color: 'gray', x: 0 },
    { title: 'In Progress 🔄', color: 'blue', x: 330 },
    { title: 'Done ✅', color: 'green', x: 660 },
  ]

  return columns.flatMap(({ title, color, x }) => [
    createStickyNote({ x, y: 0, text: title, color, w: 290, h: 80 }),
    createStickyNote({ x: x + 10, y: 100, text: '', color: 'yellow', w: 260, h: 150 }),
  ])
}

export function applyTemplate(editor: Editor, name: TemplateName) {
  let shapes
  switch (name) {
    case 'retro':
      shapes = createRetroShapes()
      break
    case 'brainstorm':
      shapes = createBrainstormShapes()
      break
    case 'kanban':
      shapes = createKanbanShapes()
      break
    default:
      return
  }
  editor.createShapes(shapes)
  editor.zoomToFit()
}
