// 보드 멤버 권한 변경 및 제거 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateMemberRoleSchema } from '@/lib/validations/member'
import type { ApiResponse } from '@/types/api.types'
import type { BoardMember } from '@/types/domain.types'

type Params = { params: Promise<{ id: string; uid: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { id, uid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { data: myMember } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMember || myMember.role !== 'owner') {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '권한 없음' }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = updateMemberRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '입력값 오류' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('board_members')
    .update({ role: parsed.data.role })
    .eq('board_id', id)
    .eq('user_id', uid)
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<BoardMember>>({ data: data as BoardMember, error: null })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, uid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { data: myMember } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMember) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '권한 없음' }, { status: 403 })
  }

  if (myMember.role !== 'owner' && user.id !== uid) {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '권한 없음' }, { status: 403 })
  }

  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', id)
    .eq('user_id', uid)

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<{ user_id: string }>>({
    data: { user_id: uid },
    error: null,
  })
}
