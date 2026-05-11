// Tldraw 내부에서 useEditor()를 통해 동기화/협업 훅을 연결하는 내부 컴포넌트
'use client'

import { useEditor, useValue } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import { useEffect, useState } from 'react'
import { useBoardSync } from '@/hooks/useBoardSync'
import { usePresence } from '@/hooks/usePresence'
import { useComments } from '@/hooks/useComments'
import { useReactions } from '@/hooks/useReactions'
import { CollaboratorCursors } from './CollaboratorCursors'
import { Toolbar } from './Toolbar'
import { MobileToolbar } from './MobileToolbar'
import { PresenceBar } from './PresenceBar'
import { ReactionPanel, ReactionCount } from './ReactionPanel'
import { CommentPin } from './CommentPin'
import { CursorChat } from './CursorChat'
import { OnboardingToast } from './OnboardingToast'
import type { ReactionEmoji } from '@/lib/validations/reaction'
import type { TemplateName } from '@/lib/tldraw/templates'

const MOBILE_BREAKPOINT = 768

type BoardSyncInnerProps = {
  boardId: string
  clientId: string
  userId: string
  authorName: string
  userColor: string
  onToggleMinimap: () => void
  showMinimap: boolean
  onOpenComments: (shapeId: string | null) => void
  onOpenHistory: () => void
  initialTemplate?: TemplateName | undefined
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
  onOpenHistory,
  initialTemplate,
}: BoardSyncInnerProps) {
  const editor = useEditor()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 모바일에서는 편집 불가 (읽기 전용)
  useEffect(() => {
    editor.updateInstanceState({ isReadonly: isMobile })
  }, [editor, isMobile])

  useBoardSync(boardId, clientId, initialTemplate)

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
      {isMobile ? (
        <MobileToolbar />
      ) : (
        <Toolbar
          boardId={boardId}
          userId={userId}
          authorName={authorName}
          onToggleMinimap={onToggleMinimap}
          showMinimap={showMinimap}
          onOpenHistory={onOpenHistory}
        />
      )}
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

      <OnboardingToast />
    </>
  )
}
