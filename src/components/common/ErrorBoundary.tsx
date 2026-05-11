// React 에러 바운더리 — 하위 컴포넌트 크래시를 포착해 fallback UI 표시
'use client'

import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="bg-background text-foreground flex h-full flex-col items-center justify-center gap-3 p-8">
          <p className="text-lg font-semibold">오류가 발생했습니다.</p>
          <p className="text-muted-foreground max-w-sm text-center text-sm">
            {this.state.error?.message ?? '알 수 없는 오류입니다.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="hover:bg-muted mt-1 rounded-lg border px-4 py-2 text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
