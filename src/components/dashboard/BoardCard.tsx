// 보드 카드 컴포넌트 — 보드 목록에서 각 보드를 표시, 이름 변경 및 삭제 지원
'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { StickerIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Board } from '@/types/domain.types'
import type { ApiResponse } from '@/types/api.types'

type BoardCardProps = { board: Board }

export function BoardCard({ board }: BoardCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(board.name)
  const [showDelete, setShowDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json: ApiResponse<Board> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setIsRenaming(false)
    },
    onError: (err) => {
      toast.error(err.message)
      setIsRenaming(false)
      setNameInput(board.name)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/boards/${board.id}`, { method: 'DELETE' })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setShowDelete(false)
    },
    onError: (err) => toast.error(err.message),
  })

  function handleRenameSubmit() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === board.name) {
      setIsRenaming(false)
      setNameInput(board.name)
      return
    }
    renameMutation.mutate(trimmed)
  }

  return (
    <>
      <div className="group relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        {/* 썸네일 */}
        <button
          className="bg-muted/50 group-hover:bg-muted relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg transition-colors"
          onClick={() => router.push(`/board/${board.id}`)}
        >
          {board.thumbnail_url ? (
            <Image
              src={board.thumbnail_url}
              alt={board.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <StickerIcon className="text-muted-foreground/50 h-8 w-8" />
          )}
        </button>

        {/* 하단 이름 + 메뉴 */}
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <Input
                ref={inputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') {
                    setIsRenaming(false)
                    setNameInput(board.name)
                  }
                }}
                className="h-7 text-sm font-medium"
              />
            ) : (
              <p className="truncate font-medium">{board.name}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(board.updated_at), { addSuffix: true, locale: ko })}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hover:bg-muted shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                title="더보기"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming(true)
                  setNameInput(board.name)
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                이름 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDelete(true)
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 삭제 확인 Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>보드 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">&ldquo;{board.name}&rdquo;</span>을(를)
            삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
