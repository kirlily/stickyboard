// 첫 접속 시 주요 기능 안내 오버레이
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'stickyboard_onboarded'

export function OnboardingToast() {
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)
  )

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-[600] -translate-x-1/2">
      <div className="max-w-xs rounded-xl border bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="mb-2 font-semibold">StickyBoard 사용법</p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>상단 스티키 버튼으로 포스트잇 추가</li>
              <li>
                <kbd className="bg-muted rounded border px-1 font-mono text-xs">/</kbd> 키로 커서
                채팅
              </li>
              <li>
                <kbd className="bg-muted rounded border px-1 font-mono text-xs">?</kbd> 키로 단축키
                도움말
              </li>
              <li>도형 위 hover로 이모지 반응 추가</li>
            </ul>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button size="sm" onClick={dismiss} className="mt-3 w-full">
          시작하기
        </Button>
      </div>
    </div>
  )
}
