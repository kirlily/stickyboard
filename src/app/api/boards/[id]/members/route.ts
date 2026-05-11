// 보드 멤버 목록 조회 API Route
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'
import type { BoardMember } from '@/types/domain.types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('board_members')
    .select('*')
    .eq('board_id', id)
    .order('joined_at', { ascending: true })

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<BoardMember[]>>({ data: data as BoardMember[], error: null })
}
