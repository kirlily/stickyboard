// 보드 버전 히스토리 사이드 패널 — 저장된 스냅샷 목록 조회 및 복원
'use client'

import { useEditor } from 'tldraw'
import { useState } from 'react'
import { History, Save, RotateCcw, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBoardHistory } from '@/hooks/useBoardHistory'
import { toast } from 'sonner'
import type { TLStoreSnapshot } from 'tldraw'
import type { BoardSnapshot } from '@/types/domain.types'

type HistoryPanelProps = {
  boardId: string
  onClose: () => void
}

export function HistoryPanel({ boardId, onClose }: HistoryPanelProps) {
  const editor = useEditor()
  const { snapshots, isLoading, saveVersion, restoreVersion } = useBoardHistory(boardId)
  const [label, setLabel] = useState('')

  async function handleSave() {
    await saveVersion.mutateAsync(label || undefined)
    setLabel('')
    toast.success('버전이 저장되었습니다.')
  }

  async function handleRestore(snapshot: Partial<BoardSnapshot>) {
    if (!snapshot.id) return
    const full = await restoreVersion.mutateAsync(snapshot.id)
    if (full?.snapshot) {
      editor.loadSnapshot(full.snapshot as unknown as TLStoreSnapshot)
      toast.success('버전이 복원되었습니다.')
      onClose()
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-background flex h-full w-72 flex-col border-l">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="text-sm font-semibold">버전 히스토리</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 현재 버전 저장 */}
      <div className="border-b p-3">
        <p className="text-muted-foreground mb-2 text-xs">현재 상태를 버전으로 저장</p>
        <div className="flex gap-2">
          <Input
            placeholder="버전 이름 (선택)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveVersion.isPending}
            className="h-8 shrink-0"
          >
            {saveVersion.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* 스냅샷 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : snapshots.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">저장된 버전이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {snapshots.map((snap) => (
              <li key={snap.id} className="hover:bg-muted/40 flex items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{snap.label ?? '이름 없는 버전'}</p>
                  <p className="text-muted-foreground text-xs">
                    {snap.created_at ? formatDate(snap.created_at) : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(snap)}
                  title="이 버전으로 복원"
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors"
                  disabled={restoreVersion.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
