// 보드 페이지 로딩 Suspense 폴백
export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
      }}
    >
      <p style={{ color: '#888', fontSize: 14 }}>보드 불러오는 중...</p>
    </div>
  )
}
