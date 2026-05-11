// 개별 보드 조회, 수정, 삭제 API Route
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse } from '@/types/api.types'
import type { Board } from '@/types/domain.types'

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
  const { data, error } = await db.from('boards').select('*').eq('id', id).single()

  if (error || !data)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '보드를 찾을 수 없습니다.' },
      { status: 404 }
    )
  return NextResponse.json<ApiResponse<Board>>({ data: data as Board, error: null })
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = z.object({ name: z.string().min(1).max(50) }).safeParse(body)
  if (!parsed.success)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '입력값 오류' },
      { status: 400 }
    )

  const db = createAdminClient()
  const { data, error } = await db
    .from('boards')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .select()
    .single()

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<Board>>({ data: data as Board, error: null })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const db = createAdminClient()
  const { error } = await db.from('boards').delete().eq('id', id)
  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<{ id: string }>>({ data: { id }, error: null })
}
