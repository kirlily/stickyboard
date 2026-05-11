// 대시보드 보드 목록 — 생성, 조회, 보드 카드 렌더링
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BoardCard } from './BoardCard'
import { createBoardSchema, type CreateBoardInput } from '@/lib/validations/board'
import type { ApiResponse } from '@/types/api.types'
import type { Board } from '@/types/domain.types'
import { useState } from 'react'
import { TEMPLATE_META } from '@/lib/tldraw/templates'
import type { TemplateName } from '@/lib/tldraw/templates'

export function BoardList() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName | null>(null)

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await fetch('/api/boards')
      const json: ApiResponse<Board[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json: ApiResponse<Board> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setOpen(false)
      reset()
      setSelectedTemplate(null)
      if (board) {
        const query = selectedTemplate ? `?template=${selectedTemplate}` : ''
        router.push(`/board/${board.id}${query}`)
      }
    },
    onError: (err) => toast.error(err.message),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardInput>({ resolver: zodResolver(createBoardSchema) })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 보드</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />새 보드
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 보드 만들기</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="flex flex-col gap-4 pt-2"
            >
              <div className="flex flex-col gap-1.5">
                <Input placeholder="보드 이름" {...register('name')} autoFocus />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">템플릿 (선택)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(TEMPLATE_META) as [
                      TemplateName,
                      (typeof TEMPLATE_META)[TemplateName],
                    ][]
                  ).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTemplate((prev) => (prev === key ? null : key))}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedTemplate === key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium">{meta.label}</span>
                      <p className="text-muted-foreground mt-0.5 text-xs">{meta.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '생성 중...' : '만들기'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {boards?.length === 0 && (
        <p className="text-muted-foreground py-12 text-center">
          아직 보드가 없습니다. 새 보드를 만들어보세요.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boards?.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </div>
    </div>
  )
}
