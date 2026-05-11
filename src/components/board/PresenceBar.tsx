// 온라인 접속자 아바타 목록 — 보드 우상단 표시
'use client'

import type { UserPresence } from '@/types/domain.types'

type PresenceBarProps = {
  myName: string
  myColor: string
  presences: UserPresence[]
}

export function PresenceBar({ myName, myColor, presences }: PresenceBarProps) {
  const all = [{ userId: 'me', name: myName, color: myColor, cursor: null }, ...presences]

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
      {all.map((p, i) => (
        <div
          key={p.userId}
          title={p.name + (i === 0 ? ' (나)' : '')}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
          style={{ backgroundColor: p.color, zIndex: all.length - i }}
        >
          {p.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {presences.length > 0 && (
        <span className="text-muted-foreground text-xs">{presences.length + 1}명 접속 중</span>
      )}
    </div>
  )
}
