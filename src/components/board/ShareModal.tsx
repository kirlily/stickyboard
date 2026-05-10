// 보드 공유 모달 — 초대 링크 생성 및 멤버 관리
'use client'

import { useState } from 'react'
import { Users, Link, Copy, Check, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBoardMembers } from '@/hooks/useBoardMembers'
import type { BoardRole } from '@/types/domain.types'

type ShareModalProps = {
  boardId: string
  userId: string
  open: boolean
  onClose: () => void
}

const ROLE_LABELS: Record<BoardRole, string> = {
  owner: '소유자',
  editor: '편집자',
  viewer: '뷰어',
}

export function ShareModal({ boardId, userId, open, onClose }: ShareModalProps) {
  const { members, updateRole, removeMember, createInvite } = useBoardMembers(boardId)
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const myRole = members.find((m) => m.user_id === userId)?.role

  async function handleCreateInvite() {
    const invite = await createInvite.mutateAsync(inviteRole)
    if (invite) {
      setInviteUrl(`${window.location.origin}/invite/${invite.token}`)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            공유 및 멤버 관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          {/* 초대 링크 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">초대 링크</p>
            <div className="flex items-center gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                className="h-8 rounded-md border bg-transparent px-2 text-sm"
              >
                <option value="editor">편집자</option>
                <option value="viewer">뷰어</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateInvite}
                disabled={createInvite.isPending}
                className="gap-1.5"
              >
                <Link className="h-3.5 w-3.5" />
                {createInvite.isPending ? '생성 중...' : '링크 생성'}
              </Button>
            </div>
            {inviteUrl && (
              <div className="bg-muted/40 flex items-center gap-2 rounded-lg border p-2">
                <p className="text-muted-foreground flex-1 truncate text-xs">{inviteUrl}</p>
                <button
                  onClick={handleCopy}
                  className="hover:bg-muted shrink-0 rounded p-1 transition-colors"
                  title="복사"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="text-muted-foreground h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="bg-border h-px" />

          {/* 멤버 목록 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">멤버 ({members.length}명)</p>
            {members.map((m) => (
              <div
                key={m.user_id}
                className="hover:bg-muted/50 flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {m.user_id === userId ? '나' : `${m.user_id.slice(0, 8)}…`}
                  </p>
                </div>
                {myRole === 'owner' && m.role !== 'owner' ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: m.user_id,
                          role: e.target.value as 'editor' | 'viewer',
                        })
                      }
                      className="h-6 rounded border bg-transparent px-1.5 text-xs"
                    >
                      <option value="editor">편집자</option>
                      <option value="viewer">뷰어</option>
                    </select>
                    <button
                      onClick={() => removeMember.mutate(m.user_id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1 transition-colors"
                      title="제거"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">{ROLE_LABELS[m.role]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
