// 모바일 읽기 전용 모드 툴바 — 간소화된 뷰어 컨트롤
'use client'

import { useEditor } from 'tldraw'
import { ZoomIn, ZoomOut, Maximize2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileToolbar() {
  const editor = useEditor()

  return (
    <div className="absolute bottom-6 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-white/95 px-2 py-1.5 shadow-md backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="text-muted-foreground flex items-center gap-1 border-r pr-2 text-xs">
        <Eye className="h-3.5 w-3.5" />
        <span>뷰어 모드</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.zoomIn()}
        title="확대"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.zoomOut()}
        title="축소"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.zoomToFit()}
        title="전체 보기"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
