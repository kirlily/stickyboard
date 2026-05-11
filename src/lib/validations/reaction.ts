// 반응 API 요청 Zod 스키마
import { z } from 'zod'

export const REACTION_EMOJIS = ['👍', '❤️', '🔥', '⭐', '💡', '🎯', '🙌', '😂'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export const createReactionSchema = z.object({
  shape_id: z.string().min(1),
  emoji: z.enum(REACTION_EMOJIS),
})

export type CreateReactionInput = z.infer<typeof createReactionSchema>
