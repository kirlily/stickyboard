// 댓글 사이드 패널 — 전체 댓글 목록, 스레드, Resolve 처리
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  X,
  MessageSquare,
  Check,
  Trash2,
  CornerDownRight,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useComments } from '@/hooks/useComments'
import type { Comment } from '@/types/domain.types'

type CommentThreadProps = {
  boardId: string
  userId: string
  focusedShapeId: string | null
  onClose: () => void
}

export function CommentThread({ boardId, userId, focusedShapeId, onClose }: CommentThreadProps) {
  const { comments, isLoading, createComment, updateComment, deleteComment } = useComments(boardId)
  const [newContent, setNewContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const allRoots = comments.filter(
    (c) => !c.parent_id && (!focusedShapeId || c.shape_id === focusedShapeId)
  )
  const resolvedCount = allRoots.filter((c) => c.resolved).length
  // 해결된 댓글 표시 여부에 따라 필터
  const roots = showResolved ? allRoots : allRoots.filter((c) => !c.resolved)
  // 자식 댓글 가져오기
  function getReplies(parentId: string): Comment[] {
    return comments.filter((c) => c.parent_id === parentId)
  }

  function handleAddComment() {
    if (!newContent.trim()) return
    createComment.mutate({
      content: newContent.trim(),
      shape_id: focusedShapeId,
    })
    setNewContent('')
  }

  function handleReply(parentId: string) {
    if (!replyContent.trim()) return
    createComment.mutate({
      content: replyContent.trim(),
      parent_id: parentId,
      shape_id: null,
    })
    setReplyContent('')
    setReplyTo(null)
  }

  return (
    <div className="flex h-full w-72 flex-col border-l bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">{focusedShapeId ? '도형 댓글' : '전체 댓글'}</span>
        </div>
        <div className="flex items-center gap-1">
          {resolvedCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={showResolved ? '해결된 댓글 숨기기' : `해결된 댓글 보기 (${resolvedCount})`}
              onClick={() => setShowResolved((v) => !v)}
            >
              {showResolved ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {isLoading && <p className="text-muted-foreground py-4 text-center text-xs">로딩 중...</p>}
        {!isLoading && roots.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-xs">첫 댓글을 작성해보세요.</p>
        )}
        {roots.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
            userId={userId}
            onResolve={(id, resolved) => updateComment.mutate({ id, resolved })}
            onDelete={(id) => deleteComment.mutate(id)}
            onReply={() => setReplyTo(comment.id)}
            showReplyInput={replyTo === comment.id}
            replyContent={replyContent}
            onReplyContentChange={setReplyContent}
            onReplySubmit={() => handleReply(comment.id)}
          />
        ))}
      </div>

      {/* 새 댓글 입력 */}
      <div className="flex gap-2 border-t p-3">
        <Input
          placeholder="댓글 입력..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={handleAddComment}
          disabled={!newContent.trim() || createComment.isPending}
        >
          전송
        </Button>
      </div>
    </div>
  )
}

type CommentItemProps = {
  comment: Comment
  replies: Comment[]
  userId: string
  onResolve: (id: string, resolved: boolean) => void
  onDelete: (id: string) => void
  onReply: () => void
  showReplyInput: boolean
  replyContent: string
  onReplyContentChange: (v: string) => void
  onReplySubmit: () => void
}

function CommentItem({
  comment,
  replies,
  userId,
  onResolve,
  onDelete,
  onReply,
  showReplyInput,
  replyContent,
  onReplyContentChange,
  onReplySubmit,
}: CommentItemProps) {
  return (
    <div className={`space-y-2 ${comment.resolved ? 'opacity-50' : ''}`}>
      <div className="bg-muted/30 space-y-1 rounded-lg border p-2.5">
        <p className="text-sm">{comment.content}</p>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onReply}
              className="text-muted-foreground hover:text-foreground rounded p-0.5"
              title="대댓글"
            >
              <CornerDownRight className="h-3 w-3" />
            </button>
            {comment.resolved ? (
              <button
                onClick={() => onResolve(comment.id, false)}
                className="rounded p-0.5 text-green-600 hover:text-orange-500"
                title="해결 취소"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={() => onResolve(comment.id, true)}
                className="text-muted-foreground rounded p-0.5 hover:text-green-600"
                title="해결됨으로 표시"
              >
                <Check className="h-3 w-3" />
              </button>
            )}
            {comment.author_id === userId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-muted-foreground hover:text-destructive rounded p-0.5"
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 대댓글 */}
      {replies.map((reply) => (
        <div key={reply.id} className="ml-4 space-y-1 rounded-lg border bg-white p-2">
          <p className="text-sm">{reply.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko })}
            </span>
            {reply.author_id === userId && (
              <button
                onClick={() => onDelete(reply.id)}
                className="text-muted-foreground hover:text-destructive rounded p-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 대댓글 입력창 */}
      {showReplyInput && (
        <div className="ml-4 flex gap-1.5">
          <Input
            placeholder="대댓글..."
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onReplySubmit()}
            className="h-7 text-xs"
            autoFocus
          />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={onReplySubmit}>
            전송
          </Button>
        </div>
      )}
    </div>
  )
}
