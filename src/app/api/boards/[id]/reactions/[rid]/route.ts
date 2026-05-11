// 반응 삭제 API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'

type Params = { params: Promise<{ id: string; rid: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { rid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const { error } = await supabase.from('reactions').delete().eq('id', rid).eq('user_id', user.id)

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  return NextResponse.json<ApiResponse<{ id: string }>>({ data: { id: rid }, error: null })
}
