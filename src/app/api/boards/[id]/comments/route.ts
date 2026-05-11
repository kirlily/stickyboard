// 댓글 목록 조회 및 생성 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createCommentSchema } from '@/lib/validations/comment'
import type { ApiResponse } from '@/types/api.types'
import type { Comment } from '@/types/domain.types'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const { id: boardId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const shapeId = searchParams.get('shape_id')

  let query = supabase
    .from('comments')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })

  if (shapeId) {
    query = query.eq('shape_id', shapeId)
  }

  const { data, error } = await query
  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Comment[]>>({ data: data as Comment[], error: null })
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
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값 오류' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      board_id: boardId,
      content: parsed.data.content,
      shape_id: parsed.data.shape_id ?? null,
      parent_id: parsed.data.parent_id ?? null,
      author_id: user.id,
    })
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Comment>>(
    { data: data as Comment, error: null },
    { status: 201 }
  )
}
