// 이미지 업로드 API Route — Supabase Storage에 저장 후 공개 URL 반환
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api.types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: '인증 필요' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '파일이 없습니다.' },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'JPG, PNG, GIF, WebP만 허용됩니다.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: '파일 크기는 10MB 이하여야 합니다.' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${user.id}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const db = createAdminClient()
  const { error } = await db.storage
    .from('board-images')
    .upload(path, arrayBuffer, { contentType: file.type })

  if (error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )

  const { data: urlData } = db.storage.from('board-images').getPublicUrl(path)
  return NextResponse.json<ApiResponse<{ url: string }>>({
    data: { url: urlData.publicUrl },
    error: null,
  })
}
