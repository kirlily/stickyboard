// 댓글 API 요청 Zod 스키마
import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  shape_id: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  resolved: z.boolean().optional(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
