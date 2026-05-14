// 대시보드 상단 네비게이션 — 로고, 로그아웃
'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { StickerIcon } from 'lucide-react'

export function DashboardNav() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('로그아웃되었습니다.')
  }

  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4 sm:px-6">
      <button
        className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-70"
        onClick={() => router.push('/')}
        title="홈으로"
      >
        <StickerIcon className="text-primary h-5 w-5" />
        YujaJam
      </button>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  )
}
