// / 단축키로 활성화되는 커서 말풍선 채팅
'use client'

import { useEditor } from 'tldraw'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type CursorChatMessage = {
  userId: string
  name: string
  color: string
  text: string
  x: number
  y: number
  expireAt: number
}

type CursorChatProps = {
  boardId: string
  userId: string
  name: string
  color: string
}

const MESSAGE_TTL_MS = 3000

export function CursorChat({ boardId, userId, name, color }: CursorChatProps) {
  const editor = useEditor()
  const [isComposing, setIsComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<CursorChatMessage[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // / 키로 입력 모드 토글
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !isComposing &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        setIsComposing(true)
        setDraft('')
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setIsComposing(false)
        setDraft('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isComposing])

  // Realtime 채널 구독
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`cursor-chat-${boardId}`)
      .on<CursorChatMessage>('broadcast', { event: 'cursor-chat' }, ({ payload }) => {
        if (payload.userId === userId) return
        setMessages((prev) => [
          ...prev.filter((m) => m.userId !== payload.userId || m.text !== payload.text),
          payload,
        ])
        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.expireAt > Date.now()))
        }, MESSAGE_TTL_MS + 100)
      })
      .subscribe()
    channelRef.current = channel
    return () => {
      channel.unsubscribe()
    }
  }, [boardId, userId])

  function sendMessage() {
    if (!draft.trim()) {
      setIsComposing(false)
      return
    }
    const cursor = editor.inputs.currentPagePoint
    const screen = editor.pageToScreen(cursor)
    const msg: CursorChatMessage = {
      userId,
      name,
      color,
      text: draft.trim(),
      x: screen.x,
      y: screen.y,
      expireAt: Date.now() + MESSAGE_TTL_MS,
    }
    channelRef.current?.send({ type: 'broadcast', event: 'cursor-chat', payload: msg })
    // 내 말풍선도 표시
    setMessages((prev) => [...prev, msg])
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.expireAt > Date.now()))
    }, MESSAGE_TTL_MS + 100)
    setDraft('')
    setIsComposing(false)
  }

  // 내 커서 위치 계산
  const myCursor = editor.inputs.currentPagePoint
  const myScreen = editor.pageToScreen(myCursor)

  return (
    <>
      {/* 다른 사용자 말풍선 */}
      {messages
        .filter((m) => m.userId !== userId)
        .map((m) => (
          <div
            key={`${m.userId}-${m.expireAt}`}
            className="animate-in fade-in zoom-in-95 pointer-events-none absolute z-[500] max-w-[160px]"
            style={{ left: m.x, top: m.y - 36 }}
          >
            <div
              className="rounded-xl px-2.5 py-1.5 text-sm font-medium text-white shadow-lg"
              style={{ backgroundColor: m.color }}
            >
              {m.text}
            </div>
            <div className="ml-3 h-1.5 w-1.5 rotate-45" style={{ backgroundColor: m.color }} />
          </div>
        ))}

      {/* 내 입력 말풍선 */}
      {isComposing && (
        <div
          className="pointer-events-auto absolute z-[500]"
          style={{ left: myScreen.x, top: myScreen.y - 44 }}
        >
          <div
            className="rounded-xl px-2.5 py-1.5 shadow-lg ring-2 ring-white/30"
            style={{ backgroundColor: color }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage()
                if (e.key === 'Escape') {
                  setIsComposing(false)
                  setDraft('')
                }
              }}
              placeholder="메시지..."
              className="w-32 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/60"
            />
          </div>
          <div className="ml-3 h-1.5 w-1.5 rotate-45" style={{ backgroundColor: color }} />
        </div>
      )}
    </>
  )
}
