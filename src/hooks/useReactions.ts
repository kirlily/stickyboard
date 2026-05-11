// 보드 이모지 반응 CRUD를 TanStack Query + Supabase Realtime으로 관리하는 훅
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reaction } from '@/types/domain.types'
import type { ApiResponse } from '@/types/api.types'
import type { CreateReactionInput } from '@/lib/validations/reaction'

export function useReactions(boardId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['reactions', boardId]

  const { data: reactions = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/reactions`)
      const json: ApiResponse<Reaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  // Supabase Realtime Postgres 변경 구독
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reactions-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `board_id=eq.${boardId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reactions', boardId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [boardId, queryClient])

  const addReaction = useMutation({
    mutationFn: async (input: CreateReactionInput) => {
      const res = await fetch(`/api/boards/${boardId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json: ApiResponse<Reaction> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const removeReaction = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/boards/${boardId}/reactions/${id}`, { method: 'DELETE' })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  // shape별로 반응 그룹화
  function getShapeReactions(shapeId: string) {
    return reactions.filter((r) => r.shape_id === shapeId)
  }

  return { reactions, addReaction, removeReaction, getShapeReactions }
}
