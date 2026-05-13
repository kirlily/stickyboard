// 커스텀 스티키 노트 ShapeUtil — 12색 팔레트, FigJam 스타일, 작성자 뱃지
import { BaseBoxShapeUtil, HTMLContainer, T, TLBaseShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'

export const STICKY_COLORS = {
  yellow: { bg: '#FFF4A3', accent: '#F59E0B', text: '#1C1917' },
  orange: { bg: '#FED7AA', accent: '#EA580C', text: '#1C1917' },
  pink: { bg: '#FBCFE8', accent: '#DB2777', text: '#1C1917' },
  red: { bg: '#FECACA', accent: '#DC2626', text: '#1C1917' },
  purple: { bg: '#E9D5FF', accent: '#7C3AED', text: '#1C1917' },
  blue: { bg: '#BFDBFE', accent: '#2563EB', text: '#1C1917' },
  cyan: { bg: '#A5F3FC', accent: '#0891B2', text: '#1C1917' },
  teal: { bg: '#99F6E4', accent: '#0D9488', text: '#1C1917' },
  green: { bg: '#BBF7D0', accent: '#16A34A', text: '#1C1917' },
  lime: { bg: '#D9F99D', accent: '#65A30D', text: '#1C1917' },
  white: { bg: '#FFFFFF', accent: '#6B7280', text: '#1C1917' },
  gray: { bg: '#E5E7EB', accent: '#374151', text: '#1C1917' },
} as const

export type StickyColor = keyof typeof STICKY_COLORS

interface StickyNoteShapeProps {
  w: number
  h: number
  color: StickyColor
  text: string
  authorName: string
}

export type StickyNoteShape = TLBaseShape<'sticky-note', StickyNoteShapeProps>

const stickyNoteShapeProps: RecordProps<StickyNoteShape> = {
  w: T.number,
  h: T.number,
  color: T.string as T.Validatable<StickyColor>,
  text: T.string,
  authorName: T.string,
}

export class StickyNoteShapeUtil extends BaseBoxShapeUtil<StickyNoteShape> {
  static override type = 'sticky-note' as const
  static override props = stickyNoteShapeProps

  override getDefaultProps(): StickyNoteShape['props'] {
    return {
      w: 200,
      h: 200,
      color: 'yellow',
      text: '',
      authorName: '',
    }
  }

  override canEdit() {
    return true
  }

  override component(shape: StickyNoteShape) {
    const colors = STICKY_COLORS[shape.props.color] ?? STICKY_COLORS.yellow
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const initial = shape.props.authorName ? shape.props.authorName.charAt(0).toUpperCase() : ''

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          backgroundColor: colors.bg,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
          cursor: isEditing ? 'text' : 'default',
        }}
      >
        {/* 텍스트 영역 */}
        <div
          style={{
            flex: 1,
            padding: '12px 12px 6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <textarea
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              lineHeight: 1.6,
              color: colors.text,
              fontFamily: 'inherit',
              outline: 'none',
              cursor: isEditing ? 'text' : 'default',
              pointerEvents: isEditing ? 'all' : 'none',
            }}
            value={shape.props.text}
            onChange={(e) => {
              this.editor.updateShape<StickyNoteShape>({
                id: shape.id,
                type: 'sticky-note',
                props: { text: e.target.value },
              })
            }}
            placeholder="내용을 입력하세요..."
          />
        </div>

        {/* 작성자 뱃지 */}
        {shape.props.authorName && (
          <div
            style={{
              padding: '0 10px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: colors.accent,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <span
              style={{
                fontSize: 11,
                color: colors.accent,
                fontWeight: 500,
                userSelect: 'none',
                opacity: 0.85,
              }}
            >
              {shape.props.authorName}
            </span>
          </div>
        )}
      </HTMLContainer>
    )
  }

  override indicator(shape: StickyNoteShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} />
  }
}

export function createStickyNote(
  options: Partial<StickyNoteShape['props']> & { x?: number; y?: number } = {}
) {
  const { x = 0, y = 0, ...props } = options
  return {
    id: createShapeId(),
    type: 'sticky-note' as const,
    x,
    y,
    props: {
      w: 200,
      h: 200,
      color: 'yellow' as StickyColor,
      text: '',
      authorName: '',
      ...props,
    },
  }
}
