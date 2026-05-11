// 다른 접속자 커서를 tldraw 캔버스 위에 오버레이로 렌더링
'use client'

import { useEditor, useValue } from 'tldraw'
import type { UserPresence } from '@/types/domain.types'

type CollaboratorCursorsProps = {
  presences: UserPresence[]
}

export function CollaboratorCursors({ presences }: CollaboratorCursorsProps) {
  const editor = useEditor()

  // 카메라 변화 시 재렌더링을 위해 camera atom을 구독
  const camera = useValue('camera', () => editor.getCamera(), [editor])

  const activeCursors = presences.filter((p) => p.cursor !== null)
  if (activeCursors.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 300 }}>
      {activeCursors.map((p) => {
        if (!p.cursor) return null
        const screen = editor.pageToScreen(p.cursor)
        return (
          <div
            key={p.userId}
            className="absolute flex items-start gap-1"
            style={{ left: screen.x, top: screen.y, transform: 'translate(-2px, -2px)' }}
          >
            {/* 커서 삼각형 */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 8L8 10L6 14L2 2Z" fill={p.color} stroke="white" strokeWidth="1.5" />
            </svg>
            {/* 이름 태그 */}
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-white"
              style={{ backgroundColor: p.color, marginTop: 2 }}
            >
              {p.name}
            </span>
          </div>
        )
      })}
      {/* camera 참조 — 재렌더링 트리거를 위해 사용하지만 렌더링 결과에는 없음 */}
      <span style={{ display: 'none' }}>{camera.z}</span>
    </div>
  )
}
