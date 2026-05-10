// 초대 링크로 보드 참여 처리 페이지
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Props = { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/invite/${token}`)

  const { data: invite } = await supabase
    .from('board_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) redirect('/?error=invalid-invite')
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    redirect('/?error=expired-invite')
  }

  const { data: existing } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', invite.board_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await supabase.from('board_members').insert({
      board_id: invite.board_id,
      user_id: user.id,
      role: invite.role,
    })
  }

  redirect(`/board/${invite.board_id}`)
}
