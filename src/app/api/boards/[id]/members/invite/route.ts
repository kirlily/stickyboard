// 보드 초대 링크 생성 API Route
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { inviteMemberSchema } from '@/lib/validations/member'
import type { ApiResponse } from '@/types/api.types'
import type { BoardInvite } from '@/types/domain.types'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const db = createAdminClient()
  const { data: member } = await db
    .from('board_members')
    .select('role')
    .eq('board_id', id)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role === 'viewer') {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '권한 없음' }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = inviteMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '입력값 오류' },
      { status: 400 }
    )
  }

  const { data, error } = await db
    .from('board_invites')
    .insert({ board_id: id, role: parsed.data.role })
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<BoardInvite>>(
    { data: data as BoardInvite, error: null },
    { status: 201 }
  )
}
