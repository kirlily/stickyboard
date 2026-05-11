// 보드 스냅샷 조회 및 저장 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'
import type { Json } from '@/types/database.types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { data, error } = await supabase.from('boards').select('snapshot').eq('id', id).single()

  if (error || !data)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '보드를 찾을 수 없습니다.' },
      { status: 404 }
    )
  return NextResponse.json<ApiResponse<Record<string, unknown> | null>>({
    data: data.snapshot as Record<string, unknown> | null,
    error: null,
  })
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const snapshot: unknown = await req.json()

  const { error } = await supabase
    .from('boards')
    .update({ snapshot: snapshot as Json })
    .eq('id', id)

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null })
}
