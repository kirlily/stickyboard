// tldraw 메인 캔버스 래퍼 — 커스텀 Shape, 실시간 동기화, Presence, 댓글, 반응 통합
'use client'

import { Tldraw, TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { useState, useCallback, useId } from 'react'
import { BoardSyncInner } from './BoardSyncInner'
import { CommentThread } from './CommentThread'
import { HistoryPanel } from './HistoryPanel'
import { customShapeUtils } from '@/lib/tldraw/customShapes'
import { pickPresenceColor } from '@/hooks/usePresence'
import type { TemplateName } from '@/lib/tldraw/templates'

type BoardCanvasProps = {
  boardId: string
  userId: string
  authorName: string
  initialTemplate?: TemplateName | undefined
}

export function BoardCanvas({ boardId, userId, authorName, initialTemplate }: BoardCanvasProps) {
  const [showMinimap, setShowMinimap] = useState(true)
  const [commentShapeId, setCommentShapeId] = useState<string | null | undefined>(undefined)
  const [showHistory, setShowHistory] = useState(false)
  // commentShapeId: undefined = 패널 닫힘, null = 전체 댓글, string = shape별 댓글
  const clientId = useId()
  const userColor = pickPresenceColor(userId)

  const handleToggleMinimap = useCallback(() => {
    setShowMinimap((v) => !v)
  }, [])

  function handleOpenComments(shapeId: string | null) {
    setCommentShapeId(shapeId)
  }

  const components: TLComponents = {
    Toolbar: null,
    ...(showMinimap ? {} : { Minimap: null }),
  }

  const isCommentOpen = commentShapeId !== undefined

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative flex-1">
        <Tldraw shapeUtils={customShapeUtils} components={components}>
          <BoardSyncInner
            boardId={boardId}
            clientId={clientId}
            userId={userId}
            authorName={authorName}
            userColor={userColor}
            onToggleMinimap={handleToggleMinimap}
            showMinimap={showMinimap}
            onOpenComments={handleOpenComments}
            onOpenHistory={() => setShowHistory(true)}
            initialTemplate={initialTemplate}
          />
        </Tldraw>
      </div>

      {/* 댓글 사이드 패널 */}
      {isCommentOpen && (
        <CommentThread
          boardId={boardId}
          userId={userId}
          focusedShapeId={commentShapeId ?? null}
          onClose={() => setCommentShapeId(undefined)}
        />
      )}

      {/* 히스토리 사이드 패널 */}
      {showHistory && <HistoryPanel boardId={boardId} onClose={() => setShowHistory(false)} />}
    </div>
  )
}
