// 인증 페이지 공통 레이아웃 — 중앙 정렬 카드 형태
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-full items-center justify-center p-4">{children}</div>
  )
}
