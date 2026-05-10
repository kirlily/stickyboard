// 보드 커스텀 툴바 — 스티키 노트 추가, 색상 선택, 미니맵, 내보내기, 공유
'use client'

import { useEditor } from 'tldraw'
import { useState } from 'react'
import { StickerIcon, Download, Map, ChevronDown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { STICKY_COLORS, StickyColor, createStickyNote } from '@/lib/tldraw/customShapes'
import { cn } from '@/lib/utils'

const COLOR_NAMES: Record<StickyColor, string> = {
  yellow: '노랑',
  orange: '주황',
  pink: '분홍',
  red: '빨강',
  purple: '보라',
  blue: '파랑',
  cyan: '하늘',
  teal: '청록',
  green: '초록',
  lime: '연두',
  white: '흰색',
  gray: '회색',
}

type ToolbarProps = {
  boardId: string
  userId: string
  authorName: string
  onToggleMinimap: () => void
  showMinimap: boolean
}

export function Toolbar({
  boardId,
  userId,
  authorName,
  onToggleMinimap,
  showMinimap,
}: ToolbarProps) {
  const editor = useEditor()
  const [selectedColor, setSelectedColor] = useState<StickyColor>('yellow')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showShare, setShowShare] = useState(false)

  function addStickyNote() {
    const viewportCenter = editor.getViewportScreenCenter()
    const canvasPoint = editor.screenToPage(viewportCenter)
    const shape = createStickyNote({
      x: canvasPoint.x - 100,
      y: canvasPoint.y - 100,
      color: selectedColor,
      authorName,
    })
    editor.createShape(shape)
    editor.setEditingShape(shape.id)
  }

  async function exportPng() {
    const shapes = editor.getCurrentPageShapes()
    if (shapes.length === 0) return
    const result = await editor.toImage(shapes, { format: 'png', scale: 2 })
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stickyboard.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentColor = STICKY_COLORS[selectedColor]

  return (
    <>
      <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-white px-2 py-1.5 shadow-md">
        {/* 스티키 노트 추가 버튼 */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={addStickyNote}
            className="gap-1.5 px-2.5"
            title="스티키 노트 추가 (뷰포트 중앙)"
          >
            <StickerIcon className="h-4 w-4" />
            <span className="text-xs">스티키</span>
          </Button>

          {/* 색상 선택 드롭다운 트리거 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowColorPicker((v) => !v)}
            title="색상 선택"
          >
            <div
              className="h-4 w-4 rounded-full border-2"
              style={{
                backgroundColor: currentColor?.bg,
                borderColor: currentColor?.border,
              }}
            />
            <ChevronDown className="ml-0.5 h-2.5 w-2.5" />
          </Button>
        </div>

        {/* 색상 팔레트 팝오버 */}
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 grid grid-cols-6 gap-1 rounded-lg border bg-white p-2 shadow-lg">
            {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => {
              const c = STICKY_COLORS[color]
              return (
                <button
                  key={color}
                  title={COLOR_NAMES[color]}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                    selectedColor === color && 'ring-2 ring-blue-500 ring-offset-1'
                  )}
                  style={{ backgroundColor: c.bg, borderColor: c.border }}
                  onClick={() => {
                    setSelectedColor(color)
                    setShowColorPicker(false)
                  }}
                />
              )
            })}
          </div>
        )}

        <div className="bg-border mx-1 h-5 w-px" />

        {/* 미니맵 토글 */}
        <Button
          variant={showMinimap ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleMinimap}
          className="gap-1.5 px-2.5"
          title="미니맵 토글"
        >
          <Map className="h-4 w-4" />
          <span className="text-xs">맵</span>
        </Button>

        {/* PNG 내보내기 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={exportPng}
          className="gap-1.5 px-2.5"
          title="PNG로 내보내기"
        >
          <Download className="h-4 w-4" />
          <span className="text-xs">내보내기</span>
        </Button>

        <div className="bg-border mx-1 h-5 w-px" />

        {/* 공유 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShare(true)}
          className="gap-1.5 px-2.5"
          title="공유 및 멤버 관리"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-xs">공유</span>
        </Button>
      </div>

      <ShareModal
        boardId={boardId}
        userId={userId}
        open={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  )
}
