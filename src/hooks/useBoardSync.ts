// tldraw 스토어와 Supabase Realtime을 연결하는 동기화 훅
'use client'

import { useEffect, useRef } from 'react'
import { useEditor } from 'tldraw'
import type { TLRecord, TLStoreSnapshot } from 'tldraw'
import type { RecordsDiff } from '@tldraw/store'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { applyTemplate } from '@/lib/tldraw/templates'
import type { TemplateName } from '@/lib/tldraw/templates'

type SyncPayload = {
  clientId: string
  changes: RecordsDiff<TLRecord>
}

const SNAPSHOT_INTERVAL_MS = 30_000
const SNAPSHOT_SIZE_WARNING_BYTES = 5 * 1024 * 1024 // 5MB

export function useBoardSync(boardId: string, clientId: string, initialTemplate?: TemplateName) {
  const editor = useEditor()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let snapshotTimer: ReturnType<typeof setInterval>

    // 1. 저장된 스냅샷 로드 (없으면 템플릿 적용)
    async function loadSnapshot() {
      const res = await fetch(`/api/boards/${boardId}/snapshot`)
      const json = await res.json()
      if (json.data && typeof json.data === 'object' && 'document' in json.data) {
        try {
          editor.loadSnapshot(json.data as TLStoreSnapshot)
        } catch (err) {
          // 손상된 스냅샷(버전 불일치 등) — 빈 캔버스에서 시작하고 DB 스냅샷도 초기화
          console.error('[useBoardSync] loadSnapshot failed:', err)
          toast.error('보드 데이터를 불러오지 못했습니다. 새 보드로 시작합니다.')
          try {
            const freshSnapshot = editor.getSnapshot()
            await fetch(`/api/boards/${boardId}/snapshot`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(freshSnapshot),
            })
          } catch {
            // 초기화 실패는 무시 — 다음 자동 저장에서 재시도
          }
        }
      } else if (initialTemplate) {
        try {
          applyTemplate(editor, initialTemplate)
        } catch (err) {
          console.error('[useBoardSync] applyTemplate failed:', err)
        }
      }
    }

    // 2. 스냅샷 저장 + 썸네일 생성 (크기 경고 포함)
    async function saveSnapshot() {
      const snapshot = editor.getSnapshot()
      const body = JSON.stringify(snapshot)
      if (body.length > SNAPSHOT_SIZE_WARNING_BYTES) {
        toast.warning('보드 크기가 큽니다. 불필요한 오브젝트를 정리해주세요.')
      }
      await fetch(`/api/boards/${boardId}/snapshot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      // 썸네일 생성 (도형이 있을 때만)
      const shapes = editor.getCurrentPageShapes()
      if (shapes.length > 0) {
        try {
          const result = await editor.toImage(shapes, { format: 'png', scale: 0.3 })
          const fd = new FormData()
          fd.append('file', result.blob, 'thumbnail.png')
          await fetch(`/api/boards/${boardId}/thumbnail`, { method: 'POST', body: fd })
        } catch {
          // 썸네일 생성 실패는 무시
        }
      }
    }

    // 3. Realtime 채널 구독
    const channel = supabase.channel(`board-${boardId}`)
    channelRef.current = channel

    channel
      .on<SyncPayload>('broadcast', { event: 'store-update' }, ({ payload }) => {
        // 자신이 보낸 메시지는 무시
        if (payload.clientId === clientId) return

        const { added, updated, removed } = payload.changes
        isSyncingRef.current = true
        try {
          editor.store.mergeRemoteChanges(() => {
            if (Object.keys(added).length) {
              editor.store.put(Object.values(added) as TLRecord[])
            }
            if (Object.keys(updated).length) {
              editor.store.put(Object.values(updated).map(([, to]) => to) as TLRecord[])
            }
            if (Object.keys(removed).length) {
              editor.store.remove(Object.keys(removed) as TLRecord['id'][])
            }
          })
        } catch (err) {
          console.error('[useBoardSync] mergeRemoteChanges failed:', err)
        } finally {
          isSyncingRef.current = false
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await loadSnapshot()

            // 4. 로컬 변경사항 브로드캐스트
            editor.store.listen(
              (entry) => {
                if (isSyncingRef.current) return
                channel.send({
                  type: 'broadcast',
                  event: 'store-update',
                  payload: {
                    clientId,
                    changes: entry.changes,
                  } satisfies SyncPayload,
                })
              },
              { source: 'user', scope: 'document' }
            )

            // 5. 30초마다 스냅샷 저장
            snapshotTimer = setInterval(saveSnapshot, SNAPSHOT_INTERVAL_MS)
          } catch (err) {
            console.error('[useBoardSync] subscribe setup failed:', err)
            toast.error('보드 초기화에 실패했습니다. 새로고침해주세요.')
          }
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('보드 연결에 실패했습니다. 새로고침해주세요.')
        } else if (status === 'TIMED_OUT') {
          toast.warning('연결 시간이 초과되었습니다. 재연결 중...')
        }
      })

    return () => {
      clearInterval(snapshotTimer)
      saveSnapshot().catch(console.error)
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, clientId])
}
