// 보드 멤버 목록 조회 및 권한/제거 관리 TanStack Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiResponse } from '@/types/api.types'
import type { BoardMember, BoardInvite } from '@/types/domain.types'

export function useBoardMembers(boardId: string) {
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/members`)
      const json: ApiResponse<BoardMember[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'editor' | 'viewer' }) => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json: ApiResponse<BoardMember> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-members', boardId] }),
    onError: (err) => toast.error(err.message),
  })

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' })
      const json: ApiResponse<{ user_id: string }> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-members', boardId] }),
    onError: (err) => toast.error(err.message),
  })

  const createInvite = useMutation({
    mutationFn: async (role: 'editor' | 'viewer') => {
      const res = await fetch(`/api/boards/${boardId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json: ApiResponse<BoardInvite> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onError: (err) => toast.error(err.message),
  })

  return { members, isLoading, updateRole, removeMember, createInvite }
}
