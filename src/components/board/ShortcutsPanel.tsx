// 키보드 단축키 레퍼런스 패널 — ? 키로 토글
'use client'

import { useEffect } from 'react'
import { Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ShortcutsPanelProps = {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['?'], label: '단축키 도움말' },
  { keys: ['/'], label: '커서 채팅' },
  { keys: ['Ctrl', 'Z'], label: '실행 취소' },
  { keys: ['Ctrl', 'Y'], label: '다시 실행' },
  { keys: ['Ctrl', 'A'], label: '전체 선택' },
  { keys: ['Delete'], label: '선택 삭제' },
  { keys: ['F'], label: '선택에 맞춤' },
  { keys: ['Space', '드래그'], label: '캔버스 이동' },
  { keys: ['Ctrl', '+'], label: '확대' },
  { keys: ['Ctrl', '-'], label: '축소' },
  { keys: ['Ctrl', '0'], label: '실제 크기로 초기화' },
  { keys: ['Ctrl', 'C'], label: '복사' },
  { keys: ['Ctrl', 'V'], label: '붙여넣기' },
  { keys: ['Esc'], label: '선택 해제 / 입력 취소' },
]

export function ShortcutsPanel({ open, onClose }: ShortcutsPanelProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        if (open) onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            키보드 단축키
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1 pt-1">
          {SHORTCUTS.map(({ keys, label }) => (
            <div
              key={label}
              className="hover:bg-muted/50 flex items-center justify-between rounded-md px-2 py-1.5"
            >
              <span className="text-muted-foreground text-sm">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={i} className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
