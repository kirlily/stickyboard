// Zod 검증 스키마 단위 테스트
import { describe, it, expect } from 'vitest'
import { createBoardSchema } from '@/lib/validations/board'
import { createCommentSchema, updateCommentSchema } from '@/lib/validations/comment'
import { createReactionSchema, REACTION_EMOJIS } from '@/lib/validations/reaction'
import { inviteMemberSchema, updateMemberRoleSchema } from '@/lib/validations/member'

describe('createBoardSchema', () => {
  it('유효한 이름 허용', () => {
    expect(createBoardSchema.safeParse({ name: '내 보드' }).success).toBe(true)
  })
  it('빈 이름 거부', () => {
    expect(createBoardSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('50자 초과 이름 거부', () => {
    expect(createBoardSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false)
  })
  it('정확히 50자 허용', () => {
    expect(createBoardSchema.safeParse({ name: 'a'.repeat(50) }).success).toBe(true)
  })
})

describe('createCommentSchema', () => {
  it('content만 있어도 허용', () => {
    expect(createCommentSchema.safeParse({ content: '안녕' }).success).toBe(true)
  })
  it('shape_id 포함 허용', () => {
    expect(createCommentSchema.safeParse({ content: '댓글', shape_id: 'shape:abc' }).success).toBe(
      true
    )
  })
  it('빈 content 거부', () => {
    expect(createCommentSchema.safeParse({ content: '' }).success).toBe(false)
  })
  it('2000자 초과 content 거부', () => {
    expect(createCommentSchema.safeParse({ content: 'a'.repeat(2001) }).success).toBe(false)
  })
})

describe('updateCommentSchema', () => {
  it('content 단독 수정 허용', () => {
    expect(updateCommentSchema.safeParse({ content: '수정됨' }).success).toBe(true)
  })
  it('resolved 단독 수정 허용', () => {
    expect(updateCommentSchema.safeParse({ resolved: true }).success).toBe(true)
  })
  it('빈 객체도 허용 (부분 업데이트)', () => {
    expect(updateCommentSchema.safeParse({}).success).toBe(true)
  })
})

describe('createReactionSchema', () => {
  it('유효한 이모지 허용', () => {
    expect(createReactionSchema.safeParse({ shape_id: 'shape:1', emoji: '👍' }).success).toBe(true)
  })
  it('허용 목록 외 이모지 거부', () => {
    expect(createReactionSchema.safeParse({ shape_id: 'shape:1', emoji: '🦄' }).success).toBe(false)
  })
  it('모든 허용 이모지 통과', () => {
    for (const emoji of REACTION_EMOJIS) {
      expect(createReactionSchema.safeParse({ shape_id: 'shape:1', emoji }).success).toBe(true)
    }
  })
})

describe('inviteMemberSchema', () => {
  it('editor 역할 허용', () => {
    expect(inviteMemberSchema.safeParse({ role: 'editor' }).success).toBe(true)
  })
  it('viewer 역할 허용', () => {
    expect(inviteMemberSchema.safeParse({ role: 'viewer' }).success).toBe(true)
  })
  it('owner 역할 거부', () => {
    expect(inviteMemberSchema.safeParse({ role: 'owner' }).success).toBe(false)
  })
})

describe('updateMemberRoleSchema', () => {
  it('editor 허용', () => {
    expect(updateMemberRoleSchema.safeParse({ role: 'editor' }).success).toBe(true)
  })
  it('잘못된 역할 거부', () => {
    expect(updateMemberRoleSchema.safeParse({ role: 'admin' }).success).toBe(false)
  })
})
