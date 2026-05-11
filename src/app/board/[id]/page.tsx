// 보드 캔버스 에디터 페이지
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardCanvasNoSSR } from '@/components/board/BoardCanvasNoSSR'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import type { TemplateName } from '@/lib/tldraw/templates'

const VALID_TEMPLATES = new Set<TemplateName>(['retro', 'brainstorm', 'kanban'])

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ template?: string }>
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { id } = await params
  const { template } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: board } = await db.from('boards').select('id, name').eq('id', id).single()

  if (!board) redirect('/')

  const authorName = user.email?.split('@')[0] ?? '익명'
  const initialTemplate =
    template && VALID_TEMPLATES.has(template as TemplateName)
      ? (template as TemplateName)
      : undefined

  return (
    <ErrorBoundary>
      <div className="bg-background h-screen w-screen overflow-hidden">
        <BoardCanvasNoSSR
          boardId={id}
          boardName={board.name}
          userId={user.id}
          authorName={authorName}
          initialTemplate={initialTemplate}
        />
      </div>
    </ErrorBoundary>
  )
}
