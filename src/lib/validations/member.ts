// 멤버 초대 및 권한 변경 입력값 검증 Zod 스키마
import { z } from 'zod'

export const boardRoleSchema = z.enum(['editor', 'viewer'])

export const inviteMemberSchema = z.object({
  role: boardRoleSchema,
})

export const updateMemberRoleSchema = z.object({
  role: boardRoleSchema,
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
