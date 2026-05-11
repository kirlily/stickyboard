// Supabase Realtime Presence로 커서 위치와 뷰포트를 동기화하는 훅
'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor } from 'tldraw'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { UserPresence } from '@/types/domain.types'
import { pickPresenceColor } from '@/lib/utils/presenceColor'

export { pickPresenceColor }

type UsePresenceOptions = {
  boardId: string
  userId: string
  name: string
  color: string
}

export function usePresence({ boardId, userId, name, color }: UsePresenceOptions) {
  const editor = useEditor()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [presences, setPresences] = useState<UserPresence[]>([])
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 현재 presence 상태 스냅샷 — cursor/viewport를 개별로 업데이트하면서 병합 전송
  const presenceRef = useRef<UserPresence>({
    userId,
    name,
    color,
    cursor: null,
    viewport: null,
  })

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel(`presence-${boardId}`, {
      config: { presence: { key: userId } },
    })
    channelRef.current = channel

    function track(patch: Partial<UserPresence>) {
      presenceRef.current = { ...presenceRef.current, ...patch }
      channel.track(presenceRef.current)
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>()
        const others = Object.values(state)
          .flat()
          .filter((p) => p.userId !== userId)
        setPresences(others)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(presenceRef.current)
        }
      })

    // 포인터 이동 — 커서 위치 throttle 전송
    function handlePointerMove(e: PointerEvent) {
      if (throttleRef.current) return
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null
        const screenPoint = { x: e.clientX, y: e.clientY }
        const pagePoint = editor.screenToPage(screenPoint)
        track({ cursor: { x: pagePoint.x, y: pagePoint.y } })
      }, 50)
    }

    function handlePointerLeave() {
      track({ cursor: null })
    }

    const container = editor.getContainer()
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)

    // 카메라 변경 — 200ms 폴링으로 뷰포트 전송 (팔로우 모드용)
    let lastCamera = editor.getCamera()
    const cameraInterval = setInterval(() => {
      const cam = editor.getCamera()
      if (cam.x !== lastCamera.x || cam.y !== lastCamera.y || cam.z !== lastCamera.z) {
        lastCamera = cam
        track({ viewport: { x: cam.x, y: cam.y, z: cam.z } })
      }
    }, 200)

    return () => {
      if (throttleRef.current) clearTimeout(throttleRef.current)
      clearInterval(cameraInterval)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, userId, name, color])

  return presences
}
