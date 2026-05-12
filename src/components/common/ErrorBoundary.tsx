// React 에러 바운더리 — 하위 컴포넌트 크래시를 포착해 fallback UI 표시
'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

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

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error.message, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          style={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 32,
            backgroundColor: '#ffffff',
            color: '#333333',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>오류가 발생했습니다.</p>
          <p style={{ fontSize: 14, color: '#666', maxWidth: 400, textAlign: 'center', margin: 0 }}>
            {this.state.error?.message ?? '알 수 없는 오류입니다.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 4,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              cursor: 'pointer',
              fontSize: 14,
              backgroundColor: '#fff',
            }}
          >
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
