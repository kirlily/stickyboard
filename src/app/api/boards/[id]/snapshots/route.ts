// 보드 버전 히스토리 API — 스냅샷 목록 조회 및 저장
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'
import type { BoardSnapshot } from '@/types/domain.types'

type Params = { params: Promise<{ id: string }> }

// board_snapshots 테이블은 migration 002에서 추가됨 — 적용 후 generate:types 실행 필요
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = { from: (table: string) => any }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const sb = supabase as unknown as AnySupabase
  const { data, error } = (await sb
    .from('board_snapshots')
    .select('id, board_id, label, created_by, created_at')
    .eq('board_id', id)
    .order('created_at', { ascending: false })
    .limit(20)) as { data: Partial<BoardSnapshot>[] | null; error: { message: string } | null }

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], error: null } satisfies ApiResponse<
    Partial<BoardSnapshot>[]
  >)
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { snapshot, label } = body as { snapshot: Record<string, unknown>; label?: string }

  const sb = supabase as unknown as AnySupabase
  const { data, error } = (await sb
    .from('board_snapshots')
    .insert({ board_id: id, snapshot, label: label ?? null, created_by: user.id })
    .select('id, board_id, label, created_by, created_at')
    .single()) as { data: Partial<BoardSnapshot> | null; error: { message: string } | null }

  if (error || !data)
    return NextResponse.json(
      { data: null, error: error?.message ?? 'Insert failed' },
      { status: 500 }
    )

  return NextResponse.json({ data, error: null } satisfies ApiResponse<Partial<BoardSnapshot>>, {
    status: 201,
  })
}
