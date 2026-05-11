// 보드 댓글 CRUD를 TanStack Query + Supabase Realtime으로 관리하는 훅
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/types/domain.types'
import type { ApiResponse } from '@/types/api.types'
import type { CreateCommentInput, UpdateCommentInput } from '@/lib/validations/comment'

export function useComments(boardId: string, shapeId?: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['comments', boardId, shapeId ?? 'all']

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = shapeId
        ? `/api/boards/${boardId}/comments?shape_id=${encodeURIComponent(shapeId)}`
        : `/api/boards/${boardId}/comments`
      const res = await fetch(url)
      const json: ApiResponse<Comment[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  // Supabase Realtime로 댓글 변경사항 구독
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', boardId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [boardId, queryClient])

  const createComment = useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const res = await fetch(`/api/boards/${boardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json: ApiResponse<Comment> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', boardId] }),
  })

  const updateComment = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCommentInput & { id: string }) => {
      const res = await fetch(`/api/boards/${boardId}/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json: ApiResponse<Comment> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', boardId] }),
  })

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/boards/${boardId}/comments/${id}`, { method: 'DELETE' })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', boardId] }),
  })

  return { comments, isLoading, createComment, updateComment, deleteComment }
}
