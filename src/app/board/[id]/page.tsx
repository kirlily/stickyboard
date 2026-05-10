// 보드 캔버스 에디터 페이지
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardCanvas } from '@/components/board/BoardCanvas'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

type Props = { params: Promise<{ id: string }> }

export default async function BoardPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: board } = await supabase.from('boards').select('id, name').eq('id', id).single()

  if (!board) redirect('/')

  const authorName = user.email?.split('@')[0] ?? '익명'

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden">
        <BoardCanvas boardId={id} userId={user.id} authorName={authorName} />
      </div>
    </ErrorBoundary>
  )
}
