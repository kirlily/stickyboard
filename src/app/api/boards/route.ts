// 보드 목록 조회 및 생성 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createBoardSchema } from '@/lib/validations/board'
import type { ApiResponse } from '@/types/api.types'
import type { Board } from '@/types/domain.types'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { data, error } = await supabase
    .from('boards')
    .select('id, name, created_by, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Board[]>>({ data: data as Board[], error: null })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = createBoardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값 오류' },
      { status: 400 }
    )
  }

  const { data: board, error } = await supabase
    .from('boards')
    .insert({ name: parsed.data.name, created_by: user.id })
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )

  // 생성자를 owner로 board_members에 추가
  await supabase.from('board_members').insert({
    board_id: board.id,
    user_id: user.id,
    role: 'owner',
  })

  return NextResponse.json<ApiResponse<Board>>(
    { data: board as Board, error: null },
    { status: 201 }
  )
}
