// 보드 썸네일 저장 API — Supabase Storage board-images 버킷 사용
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'

type Params = { params: Promise<{ id: string }> }

// thumbnail_url 컬럼은 migration 002에서 추가됨 — 적용 후 generate:types 실행 필요
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = { from: (table: string) => any }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ data: null, error: 'No file' }, { status: 400 })

  const path = `thumbnails/${id}.png`
  const { error: uploadError } = await supabase.storage
    .from('board-images')
    .upload(path, file, { upsert: true, contentType: 'image/png' })

  if (uploadError)
    return NextResponse.json({ data: null, error: uploadError.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = supabase.storage.from('board-images').getPublicUrl(path)

  const sb = supabase as unknown as AnySupabase
  const { error: updateError } = (await sb
    .from('boards')
    .update({ thumbnail_url: publicUrl })
    .eq('id', id)) as { error: { message: string } | null }

  if (updateError)
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 })

  return NextResponse.json({ data: { url: publicUrl }, error: null } satisfies ApiResponse<{
    url: string
  }>)
}
