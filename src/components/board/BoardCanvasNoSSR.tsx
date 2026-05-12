// tldraw SSR 방지 래퍼 — 브라우저에서만 BoardCanvas를 렌더링
'use client'

import dynamic from 'next/dynamic'
import type { TemplateName } from '@/lib/tldraw/templates'

function CanvasLoading() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
      }}
    >
      <p style={{ color: '#888', fontSize: 14 }}>보드 불러오는 중...</p>
    </div>
  )
}

const BoardCanvas = dynamic(
  () => import('./BoardCanvas').then((m) => ({ default: m.BoardCanvas })),
  { ssr: false, loading: CanvasLoading }
)

type Props = {
  boardId: string
  boardName: string
  userId: string
  authorName: string
  initialTemplate?: TemplateName | undefined
}

export function BoardCanvasNoSSR(props: Props) {
  return <BoardCanvas {...props} />
}
