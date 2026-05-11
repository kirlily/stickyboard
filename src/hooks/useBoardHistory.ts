// 보드 버전 히스토리를 관리하는 TanStack Query 훅
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiResponse } from '@/types/api.types'
import type { BoardSnapshot } from '@/types/domain.types'

export function useBoardHistory(boardId: string) {
  const queryClient = useQueryClient()

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['board-snapshots', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/snapshots`)
      const json: ApiResponse<Partial<BoardSnapshot>[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  const saveVersion = useMutation({
    mutationFn: async (label?: string) => {
      const snapshotRes = await fetch(`/api/boards/${boardId}/snapshot`)
      const snapshotJson: ApiResponse<Record<string, unknown>> = await snapshotRes.json()
      if (!snapshotJson.data) throw new Error('스냅샷 없음')

      const res = await fetch(`/api/boards/${boardId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snapshotJson.data, label }),
      })
      const json: ApiResponse<Partial<BoardSnapshot>> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-snapshots', boardId] })
    },
  })

  const restoreVersion = useMutation({
    mutationFn: async (snapshotId: string) => {
      const res = await fetch(`/api/boards/${boardId}/snapshots/${snapshotId}`)
      const json: ApiResponse<BoardSnapshot> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
  })

  return { snapshots, isLoading, saveVersion, restoreVersion }
}
