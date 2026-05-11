// 특정 버전 스냅샷 상세 조회 (복원용)
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'
import type { BoardSnapshot } from '@/types/domain.types'

type Params = { params: Promise<{ id: string; sid: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id, sid } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('board_snapshots')
    .select('*')
    .eq('id', sid)
    .eq('board_id', id)
    .single()

  if (error || !data)
    return NextResponse.json({ data: null, error: error?.message ?? 'Not found' }, { status: 404 })

  return NextResponse.json({
    data: data as unknown as BoardSnapshot,
    error: null,
  } satisfies ApiResponse<BoardSnapshot>)
}
