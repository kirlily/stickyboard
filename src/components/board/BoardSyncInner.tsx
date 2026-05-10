// Tldraw 내부에서 useEditor()를 통해 동기화/협업 훅을 연결하는 내부 컴포넌트
'use client'

import { useEditor, useValue } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import { useBoardSync } from '@/hooks/useBoardSync'
import { usePresence } from '@/hooks/usePresence'
import { useComments } from '@/hooks/useComments'
import { useReactions } from '@/hooks/useReactions'
import { CollaboratorCursors } from './CollaboratorCursors'
import { Toolbar } from './Toolbar'
import { PresenceBar } from './PresenceBar'
import { ReactionPanel, ReactionCount } from './ReactionPanel'
import { CommentPin } from './CommentPin'
import { CursorChat } from './CursorChat'
import type { ReactionEmoji } from '@/lib/validations/reaction'

type BoardSyncInnerProps = {
  boardId: string
  clientId: string
  userId: string
  authorName: string
  userColor: string
  onToggleMinimap: () => void
  showMinimap: boolean
  onOpenComments: (shapeId: string | null) => void
}

export function BoardSyncInner({
  boardId,
  clientId,
  userId,
  authorName,
  userColor,
  onToggleMinimap,
  showMinimap,
  onOpenComments,
}: BoardSyncInnerProps) {
  const editor = useEditor()

  useBoardSync(boardId, clientId)

  const presences = usePresence({ boardId, userId, name: authorName, color: userColor })
  const { comments } = useComments(boardId)
  const { reactions, addReaction, removeReaction } = useReactions(boardId)

  // 현재 페이지의 모든 shape ID 목록 (반응 오버레이 렌더링용)
  const shapeIds = useValue('shapeIds', () => editor.getCurrentPageShapeIds(), [editor])

  function handleAddReaction(shapeId: string, emoji: ReactionEmoji) {
    addReaction.mutate({ shape_id: shapeId, emoji })
  }

  function handleRemoveReaction(id: string) {
    removeReaction.mutate(id)
  }

  return (
    <>
      <Toolbar
        boardId={boardId}
        userId={userId}
        authorName={authorName}
        onToggleMinimap={onToggleMinimap}
        showMinimap={showMinimap}
      />
      <PresenceBar myName={authorName} myColor={userColor} presences={presences} />
      <CollaboratorCursors presences={presences} />
      <CursorChat boardId={boardId} userId={userId} name={authorName} color={userColor} />

      {/* shape별 반응 수 오버레이 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 340 }}>
        {Array.from(shapeIds).map((id) => (
          <ReactionCount key={id as string} shapeId={id as TLShapeId} reactions={reactions} />
        ))}
      </div>

      {/* shape별 댓글 핀 */}
      <div className="pointer-events-auto absolute inset-0 overflow-hidden" style={{ zIndex: 360 }}>
        {Array.from(shapeIds).map((id) => (
          <CommentPin
            key={id as string}
            shapeId={id as TLShapeId}
            comments={comments}
            onClick={onOpenComments}
          />
        ))}
      </div>

      {/* hover 반응 팝오버 */}
      <div className="pointer-events-auto absolute inset-0 overflow-hidden" style={{ zIndex: 400 }}>
        <ReactionPanel
          boardId={boardId}
          userId={userId}
          reactions={reactions}
          onAdd={handleAddReaction}
          onRemove={handleRemoveReaction}
        />
      </div>
    </>
  )
}
