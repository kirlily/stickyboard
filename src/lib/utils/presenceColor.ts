// 접속자 색상 팔레트 — userId 해시로 결정론적 배정
const PRESENCE_COLORS = [
  '#E53E3E',
  '#DD6B20',
  '#D69E2E',
  '#38A169',
  '#319795',
  '#3182CE',
  '#805AD5',
  '#D53F8C',
]

export function pickPresenceColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length] ?? PRESENCE_COLORS[0]!
}
