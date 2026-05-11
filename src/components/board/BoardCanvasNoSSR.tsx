// tldraw SSR 방지 래퍼 — 브라우저에서만 BoardCanvas를 렌더링
'use client'

import dynamic from 'next/dynamic'
import type { TemplateName } from '@/lib/tldraw/templates'

const BoardCanvas = dynamic(
  () => import('./BoardCanvas').then((m) => ({ default: m.BoardCanvas })),
  { ssr: false }
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
