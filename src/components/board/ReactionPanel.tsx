// shape hover 시 표시되는 이모지 반응 팝오버
'use client'

import { useEditor, useValue } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/validations/reaction'
import type { Reaction } from '@/types/domain.types'

type ReactionPanelProps = {
  boardId: string
  userId: string
  reactions: Reaction[]
  onAdd: (shapeId: string, emoji: ReactionEmoji) => void
  onRemove: (id: string) => void
}

export function ReactionPanel({ userId, reactions, onAdd, onRemove }: ReactionPanelProps) {
  const editor = useEditor()

  const hoveredShapeId = useValue('hoveredShapeId', () => editor.getHoveredShapeId(), [editor])
  const camera = useValue('camera', () => editor.getCamera(), [editor])

  if (!hoveredShapeId) return null

  const bounds = editor.getShapePageBounds(hoveredShapeId)
  if (!bounds) return null

  const bottomLeft = editor.pageToScreen({ x: bounds.minX, y: bounds.maxY })

  function handleClick(emoji: ReactionEmoji) {
    if (!hoveredShapeId) return
    const existing = reactions.find(
      (r) => r.shape_id === hoveredShapeId && r.emoji === emoji && r.user_id === userId
    )
    if (existing) {
      onRemove(existing.id)
    } else {
      onAdd(hoveredShapeId as string, emoji)
    }
  }

  return (
    <div
      className="pointer-events-auto absolute z-[400] flex gap-0.5 rounded-lg border bg-white p-1 shadow-lg"
      style={{ left: bottomLeft.x, top: bottomLeft.y + 6 }}
      // 팝오버에 마우스가 들어와도 hover shape 감지가 유지되도록 stopPropagation
      onPointerMove={(e) => e.stopPropagation()}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const mine = reactions.some(
          (r) =>
            r.shape_id === (hoveredShapeId as string) && r.emoji === emoji && r.user_id === userId
        )
        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            className={`rounded p-0.5 text-lg leading-none transition-transform hover:scale-125 ${mine ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-muted'}`}
            title={emoji}
          >
            {emoji}
          </button>
        )
      })}
      {/* camera 참조 — 재렌더링 트리거 */}
      <span style={{ display: 'none' }}>{camera.z}</span>
    </div>
  )
}

// shape 우측 하단에 반응 수를 표시하는 오버레이
type ReactionOverlayProps = {
  shapeId: TLShapeId
  reactions: Reaction[]
}

export function ReactionCount({ shapeId, reactions }: ReactionOverlayProps) {
  const editor = useEditor()
  const camera = useValue('camera', () => editor.getCamera(), [editor])

  const shapeReactions = reactions.filter((r) => r.shape_id === shapeId)
  if (shapeReactions.length === 0) return null

  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null

  const bottomRight = editor.pageToScreen({ x: bounds.maxX, y: bounds.maxY })

  // 이모지 집계
  const grouped = shapeReactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
    return acc
  }, {})

  return (
    <div
      className="pointer-events-none absolute z-[350] flex gap-1"
      style={{ left: bottomRight.x - 4, top: bottomRight.y - 20, transform: 'translateX(-100%)' }}
    >
      {Object.entries(grouped).map(([emoji, count]) => (
        <span
          key={emoji}
          className="flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-black/10"
        >
          {emoji}
          {count > 1 && <span className="font-medium">{count}</span>}
        </span>
      ))}
      <span style={{ display: 'none' }}>{camera.z}</span>
    </div>
  )
}
