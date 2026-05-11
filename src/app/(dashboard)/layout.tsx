// 대시보드 레이아웃 — 상단 네비게이션 포함
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <DashboardNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
