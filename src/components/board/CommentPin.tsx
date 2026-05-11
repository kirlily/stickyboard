// 캔버스 위 도형별 댓글 핀 오버레이
'use client'

import { useEditor, useValue } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import { MessageSquare } from 'lucide-react'
import type { Comment } from '@/types/domain.types'

type CommentPinProps = {
  shapeId: TLShapeId
  comments: Comment[]
  onClick: (shapeId: string) => void
}

export function CommentPin({ shapeId, comments, onClick }: CommentPinProps) {
  const editor = useEditor()
  const camera = useValue('camera', () => editor.getCamera(), [editor])

  const shapeComments = comments.filter((c) => c.shape_id === shapeId && !c.parent_id)
  if (shapeComments.length === 0) return null

  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null

  const topRight = editor.pageToScreen({ x: bounds.maxX, y: bounds.minY })
  const resolved = shapeComments.every((c) => c.resolved)

  return (
    <button
      className={`pointer-events-auto absolute z-[360] flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium shadow-md transition-opacity ${
        resolved
          ? 'bg-muted text-muted-foreground opacity-50'
          : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'
      }`}
      style={{ left: topRight.x - 4, top: topRight.y - 20 }}
      onClick={() => onClick(shapeId as string)}
      title="댓글 보기"
    >
      <MessageSquare className="h-3 w-3" />
      {shapeComments.length}
      <span style={{ display: 'none' }}>{camera.z}</span>
    </button>
  )
}
