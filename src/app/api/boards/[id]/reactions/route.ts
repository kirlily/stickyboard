// 반응 목록 조회 및 추가 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createReactionSchema } from '@/lib/validations/reaction'
import type { ApiResponse } from '@/types/api.types'
import type { Reaction } from '@/types/domain.types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: boardId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { data, error } = await supabase.from('reactions').select('*').eq('board_id', boardId)

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Reaction[]>>({ data: data as Reaction[], error: null })
}

export async function POST(req: Request, { params }: Params) {
  const { id: boardId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = createReactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값 오류' },
      { status: 400 }
    )
  }

  // 이미 반응이 있으면 upsert (unique constraint: board_id, shape_id, user_id, emoji)
  const { data, error } = await supabase
    .from('reactions')
    .upsert({
      board_id: boardId,
      shape_id: parsed.data.shape_id,
      emoji: parsed.data.emoji,
      user_id: user.id,
    })
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Reaction>>(
    { data: data as Reaction, error: null },
    { status: 201 }
  )
}
