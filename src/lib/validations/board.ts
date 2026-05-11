// 보드 생성/수정 입력값 검증 Zod 스키마
import { z } from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(1, '보드 이름을 입력하세요.').max(50, '보드 이름은 50자 이내로 입력하세요.'),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
