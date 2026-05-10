// pickPresenceColor 유틸 단위 테스트
import { describe, it, expect } from 'vitest'
import { pickPresenceColor } from '@/lib/utils/presenceColor'

describe('pickPresenceColor', () => {
  it('유효한 hex 색상 반환', () => {
    const color = pickPresenceColor('user-123')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('동일 userId에 대해 결정론적으로 같은 색상 반환', () => {
    expect(pickPresenceColor('abc-def')).toBe(pickPresenceColor('abc-def'))
    expect(pickPresenceColor('user-xyz-000')).toBe(pickPresenceColor('user-xyz-000'))
  })

  it('빈 문자열에도 유효한 색상 반환', () => {
    const color = pickPresenceColor('')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('서로 다른 userId는 전체적으로 여러 색상 사용', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `user-${i}`)
    const colors = new Set(ids.map(pickPresenceColor))
    expect(colors.size).toBeGreaterThan(1)
  })

  it('팔레트 범위 밖 인덱스가 발생하지 않음', () => {
    for (let i = 0; i < 100; i++) {
      const color = pickPresenceColor(`test-user-${i}-${Math.random()}`)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
