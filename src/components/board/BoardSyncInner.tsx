// Tldraw 내부에서 useEditor()를 통해 동기화/협업 훅을 연결하는 내부 컴포넌트
'use client'

import { useEditor, useValue } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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
import { PresentationMode } from './PresentationMode'
import type { ReactionEmoji } from '@/lib/validations/reaction'
import type { TemplateName } from '@/lib/tldraw/templates'

const MOBILE_BREAKPOINT = 768

type BoardSyncInnerProps = {
  boardId: string
  boardName: string
  clientId: string
  userId: string
  authorName: string
  userColor: string
  onToggleMinimap: () => void
  showMinimap: boolean
  onOpenComments: (shapeId: string | null) => void
  onOpenHistory: () => void
  showPresentation: boolean
  onStartPresentation: () => void
  onEndPresentation: () => void
  initialTemplate?: TemplateName | undefined
}

export function BoardSyncInner({
  boardId,
  boardName,
  clientId,
  userId,
  authorName,
  userColor,
  onToggleMinimap,
  showMinimap,
  onOpenComments,
  onOpenHistory,
  showPresentation,
  onStartPresentation,
  onEndPresentation,
  initialTemplate,
}: BoardSyncInnerProps) {
  const editor = useEditor()
  const [isMobile, setIsMobile] = useState(false)
  const [followingUserId, setFollowingUserId] = useState<string | null>(null)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    editor.updateInstanceState({ isReadonly: isMobile })
  }, [editor, isMobile])

  useBoardSync(boardId, clientId, initialTemplate)

  const presences = usePresence({ boardId, userId, name: authorName, color: userColor })
  const { comments } = useComments(boardId)
  const { reactions, addReaction, removeReaction } = useReactions(boardId)

  // 팔로우 모드 — 대상 사용자의 뷰포트를 내 에디터에 적용
  useEffect(() => {
    if (!followingUserId) return
    const followed = presences.find((p) => p.userId === followingUserId)
    if (!followed) {
      // 팔로우 대상이 나갔을 때 — 다음 틱에 해제 (effect 내 직접 setState 금지)
      const t = setTimeout(() => setFollowingUserId(null), 0)
      return () => clearTimeout(t)
    }
    if (followed.viewport) {
      editor.setCamera(followed.viewport, { animation: { duration: 150 } })
    }
    return undefined
  }, [presences, followingUserId, editor])

  // 다른 사용자가 댓글을 달면 toast 알림
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comment-notify-${boardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        (payload) => {
          const newComment = payload.new as { author_id: string | null; content: string }
          if (newComment.author_id && newComment.author_id !== userId) {
            toast('새 댓글이 달렸습니다', {
              description: newComment.content.slice(0, 60),
              duration: 4000,
            })
          }
        }
      )
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [boardId, userId])

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
          boardName={boardName}
          userId={userId}
          authorName={authorName}
          onToggleMinimap={onToggleMinimap}
          showMinimap={showMinimap}
          onOpenHistory={onOpenHistory}
          onStartPresentation={onStartPresentation}
        />
      )}
      <PresenceBar
        myName={authorName}
        myColor={userColor}
        presences={presences}
        followingUserId={followingUserId}
        onFollow={setFollowingUserId}
      />
      <CollaboratorCursors presences={presences} />
      <CursorChat boardId={boardId} userId={userId} name={authorName} color={userColor} />

      {/* shape별 반응 수 오버레이 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 340 }}>
        {Array.from(shapeIds).map((id) => (
          <ReactionCount key={id as string} shapeId={id as TLShapeId} reactions={reactions} />
        ))}
      </div>

      {/* shape별 댓글 핀 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 360 }}>
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 400 }}>
        <ReactionPanel
          boardId={boardId}
          userId={userId}
          reactions={reactions}
          onAdd={handleAddReaction}
          onRemove={handleRemoveReaction}
        />
      </div>

      {/* 발표 모드 컨트롤 바 */}
      {showPresentation && <PresentationMode onEnd={onEndPresentation} />}

      <OnboardingToast />
    </>
  )
}
