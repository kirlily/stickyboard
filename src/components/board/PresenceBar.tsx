// 온라인 접속자 아바타 목록 — 팔로우 버튼 포함, 보드 우상단 표시
'use client'

import type { UserPresence } from '@/types/domain.types'

type PresenceBarProps = {
  myName: string
  myColor: string
  presences: UserPresence[]
  followingUserId: string | null
  onFollow: (userId: string | null) => void
}

export function PresenceBar({
  myName,
  myColor,
  presences,
  followingUserId,
  onFollow,
}: PresenceBarProps) {
  const all = [
    { userId: 'me', name: myName, color: myColor, cursor: null, viewport: null },
    ...presences,
  ]

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
      {all.map((p, i) => {
        const isMe = i === 0
        const isFollowing = followingUserId === p.userId

        return (
          <div key={p.userId} className="group relative">
            <div
              title={p.name + (isMe ? ' (나)' : '')}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-semibold text-white shadow-sm select-none"
              style={{
                backgroundColor: p.color,
                borderColor: isFollowing ? '#fff' : p.color,
                outline: isFollowing ? `2px solid ${p.color}` : 'none',
                zIndex: all.length - i,
              }}
              onClick={() => {
                if (isMe) return
                onFollow(isFollowing ? null : p.userId)
              }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>

            {/* 팔로우 툴팁 */}
            {!isMe && (
              <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-1 hidden -translate-x-1/2 flex-col items-center group-hover:flex">
                <div className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white shadow">
                  {isFollowing ? '팔로우 중 (클릭해제)' : `${p.name} 팔로우`}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {presences.length > 0 && (
        <span className="text-muted-foreground text-xs">{presences.length + 1}명 접속 중</span>
      )}
    </div>
  )
}
