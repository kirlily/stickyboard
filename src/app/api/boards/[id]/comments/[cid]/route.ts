// 댓글 수정 및 삭제 API Route
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateCommentSchema } from '@/lib/validations/comment'
import type { ApiResponse } from '@/types/api.types'
import type { Comment } from '@/types/domain.types'

type Params = { params: Promise<{ id: string; cid: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { cid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = updateCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error.issues[0]?.message ?? '입력값 오류' },
      { status: 400 }
    )
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('comments')
    .update({
      ...(parsed.data.content !== undefined && { content: parsed.data.content }),
      ...(parsed.data.resolved !== undefined && { resolved: parsed.data.resolved }),
    })
    .eq('id', cid)
    .eq('author_id', user.id)
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Comment>>({ data: data as Comment, error: null })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { cid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const db = createAdminClient()
  const { error } = await db.from('comments').delete().eq('id', cid).eq('author_id', user.id)

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<{ id: string }>>({ data: { id: cid }, error: null })
}
