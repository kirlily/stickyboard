// 섹션 순서대로 뷰포트를 이동하는 프레젠테이션 모드 컨트롤 바
'use client'

import { useEditor, useValue } from 'tldraw'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SectionShape } from '@/lib/tldraw/sectionShape'

type PresentationModeProps = {
  onEnd: () => void
}

export function PresentationMode({ onEnd }: PresentationModeProps) {
  const editor = useEditor()
  const [currentIndex, setCurrentIndex] = useState(0)

  const sections = useValue(
    'sections',
    () =>
      (editor.getCurrentPageShapes() as ReturnType<typeof editor.getCurrentPageShapes>[number][])
        .filter((s): s is SectionShape => s.type === 'section')
        .sort((a, b) => {
          // 위→아래, 왼→오른쪽 순 정렬
          if (Math.abs(a.y - b.y) > 60) return a.y - b.y
          return a.x - b.x
        }),
    [editor]
  )

  function goTo(index: number) {
    const section = sections[index]
    if (!section) return
    const bounds = editor.getShapePageBounds(section.id)
    if (bounds) {
      editor.zoomToBounds(bounds, { animation: { duration: 500 }, inset: 48 })
    }
    setCurrentIndex(index)
  }

  // 첫 진입 시 첫 섹션으로 이동 — 다음 틱에 실행 (effect 내 직접 setState 금지)
  useEffect(() => {
    if (sections.length === 0) return
    const t = setTimeout(() => goTo(0), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 키보드 좌우 화살표 네비게이션
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentIndex((i) => {
          const next = Math.min(i + 1, sections.length - 1)
          goTo(next)
          return next
        })
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentIndex((i) => {
          const prev = Math.max(i - 1, 0)
          goTo(prev)
          return prev
        })
      }
      if (e.key === 'Escape') onEnd()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

  if (sections.length === 0) {
    return (
      <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border bg-white px-4 py-2.5 shadow-lg">
        <span className="text-muted-foreground text-sm">
          섹션이 없습니다. 툴바에서 섹션을 먼저 추가하세요.
        </span>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEnd}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const currentSection = sections[currentIndex]

  return (
    <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-xl">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => goTo(currentIndex - 1)}
        disabled={currentIndex === 0}
        title="이전 섹션 (←)"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[100px] text-center text-sm font-semibold">
        {currentSection?.props.title ?? '섹션'}&nbsp;
        <span className="text-muted-foreground text-xs font-normal">
          {currentIndex + 1} / {sections.length}
        </span>
      </span>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => goTo(currentIndex + 1)}
        disabled={currentIndex === sections.length - 1}
        title="다음 섹션 (→)"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 섹션 인디케이터 도트 */}
      {sections.length > 1 && (
        <>
          <div className="bg-border mx-1 h-5 w-px" />
          <div className="flex gap-1">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="bg-border mx-1 h-5 w-px" />

      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground h-7 gap-1 px-2 text-xs"
        onClick={onEnd}
        title="발표 종료 (Esc)"
      >
        <X className="h-3 w-3" />
        종료
      </Button>
    </div>
  )
}
