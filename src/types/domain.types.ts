export type BoardRole = 'owner' | 'editor' | 'viewer'

export type Board = {
  id: string
  name: string
  snapshot: Record<string, unknown> | null
  thumbnail_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type BoardSnapshot = {
  id: string
  board_id: string
  snapshot: Record<string, unknown>
  label: string | null
  created_by: string | null
  created_at: string
}

export type BoardMember = {
  board_id: string
  user_id: string
  role: BoardRole
  joined_at: string
}

export type BoardInvite = {
  id: string
  board_id: string
  token: string
  role: BoardRole
  expires_at: string | null
  created_at: string
}

export type Comment = {
  id: string
  board_id: string
  shape_id: string | null
  parent_id: string | null
  content: string
  author_id: string
  resolved: boolean
  created_at: string
  updated_at: string
}

export type Reaction = {
  id: string
  board_id: string
  shape_id: string
  emoji: string
  user_id: string
  created_at: string
}

export type UserPresence = {
  userId: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
}
