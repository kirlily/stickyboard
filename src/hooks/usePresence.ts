// Supabase Realtime Presence로 커서 위치와 접속자를 동기화하는 훅
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

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel(`presence-${boardId}`, {
      config: { presence: { key: userId } },
    })
    channelRef.current = channel

    const myPresence: UserPresence = { userId, name, color, cursor: null }

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
          await channel.track(myPresence)
        }
      })

    // 포인터 이동 시 페이지 좌표를 throttle해서 presence 업데이트
    function handlePointerMove(e: PointerEvent) {
      if (throttleRef.current) return
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null
        const screenPoint = { x: e.clientX, y: e.clientY }
        const pagePoint = editor.screenToPage(screenPoint)
        channel.track({ userId, name, color, cursor: { x: pagePoint.x, y: pagePoint.y } })
      }, 50)
    }

    function handlePointerLeave() {
      channel.track({ userId, name, color, cursor: null })
    }

    const container = editor.getContainer()
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      if (throttleRef.current) clearTimeout(throttleRef.current)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, userId, name, color])

  return presences
}
