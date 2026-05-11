// 보드 커스텀 툴바 — 스티키 노트 추가, 색상 선택, 미니맵, 내보내기, 공유, 단축키
'use client'

import { useEditor, useValue } from 'tldraw'
import { useState } from 'react'
import {
  StickerIcon,
  Download,
  Map,
  ChevronDown,
  Share2,
  Undo2,
  Redo2,
  Keyboard,
  Timer,
  Vote,
  History,
  Network,
  SquareDashed,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { ShortcutsPanel } from './ShortcutsPanel'
import {
  STICKY_COLORS,
  StickyColor,
  createStickyNote,
  createTimer,
  createPoll,
  createSection,
} from '@/lib/tldraw/customShapes'
import { applyMindmapLayout } from '@/lib/tldraw/mindmapLayout'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  boardName: string
  onToggleMinimap: () => void
  showMinimap: boolean
  onOpenHistory: () => void
  onStartPresentation: () => void
}

export function Toolbar({
  boardId,
  userId,
  authorName,
  boardName,
  onToggleMinimap,
  showMinimap,
  onOpenHistory,
  onStartPresentation,
}: ToolbarProps) {
  const editor = useEditor()
  const [selectedColor, setSelectedColor] = useState<StickyColor>('yellow')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const canUndo = useValue('canUndo', () => editor.getCanUndo(), [editor])
  const canRedo = useValue('canRedo', () => editor.getCanRedo(), [editor])

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

  function addTimer() {
    const viewportCenter = editor.getViewportScreenCenter()
    const canvasPoint = editor.screenToPage(viewportCenter)
    const shape = createTimer({ x: canvasPoint.x - 100, y: canvasPoint.y - 110 })
    editor.createShape(shape)
  }

  function addPoll() {
    const viewportCenter = editor.getViewportScreenCenter()
    const canvasPoint = editor.screenToPage(viewportCenter)
    const shape = createPoll({ x: canvasPoint.x - 130, y: canvasPoint.y - 110 })
    editor.createShape(shape)
  }

  function applyLayout() {
    const applied = applyMindmapLayout(editor)
    if (!applied) toast.info('화살표로 연결된 도형이 없습니다.')
  }

  function addSection() {
    const viewportCenter = editor.getViewportScreenCenter()
    const canvasPoint = editor.screenToPage(viewportCenter)
    const shape = createSection({ x: canvasPoint.x - 320, y: canvasPoint.y - 210 })
    editor.createShape(shape)
    // 섹션은 다른 도형 뒤에 위치하도록 맨 아래로 이동
    editor.sendToBack([shape.id])
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
      <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-white px-2 py-1.5 shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        {/* 보드 이름 */}
        <span className="max-w-[120px] truncate px-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {boardName}
        </span>

        <div className="bg-border mx-1 h-5 w-px" />

        {/* Undo / Redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.undo()}
          disabled={!canUndo}
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.redo()}
          disabled={!canRedo}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="bg-border mx-1 h-5 w-px" />

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
          <div className="absolute top-full left-0 mt-1 grid grid-cols-6 gap-1 rounded-lg border bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
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

        {/* 타이머 위젯 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addTimer}
          className="gap-1.5 px-2.5"
          title="타이머 추가"
        >
          <Timer className="h-4 w-4" />
          <span className="text-xs">타이머</span>
        </Button>

        {/* 투표 위젯 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addPoll}
          className="gap-1.5 px-2.5"
          title="투표 추가"
        >
          <Vote className="h-4 w-4" />
          <span className="text-xs">투표</span>
        </Button>

        {/* 섹션/프레임 추가 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addSection}
          className="gap-1.5 px-2.5"
          title="섹션 추가 — 영역 구분 및 발표 모드에서 활용"
        >
          <SquareDashed className="h-4 w-4" />
          <span className="text-xs">섹션</span>
        </Button>

        {/* 마인드맵 레이아웃 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={applyLayout}
          className="gap-1.5 px-2.5"
          title="마인드맵 자동 레이아웃"
        >
          <Network className="h-4 w-4" />
          <span className="text-xs">레이아웃</span>
        </Button>

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

        {/* 발표 모드 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartPresentation}
          className="gap-1.5 px-2.5"
          title="발표 모드 — 섹션 순서대로 이동"
        >
          <Monitor className="h-4 w-4" />
          <span className="text-xs">발표</span>
        </Button>

        {/* 히스토리 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onOpenHistory}
          title="버전 히스토리"
        >
          <History className="h-3.5 w-3.5" />
        </Button>

        {/* 단축키 도움말 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowShortcuts(true)}
          title="단축키 도움말 (?)"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ShareModal
        boardId={boardId}
        userId={userId}
        open={showShare}
        onClose={() => setShowShare(false)}
      />
      <ShortcutsPanel open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
