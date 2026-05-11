// 커스텀 스티키 노트 ShapeUtil — 12색 팔레트, 작성자 표시, 텍스트 자동 크기
import { BaseBoxShapeUtil, HTMLContainer, RecordPropsType, T, TLShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'
import type { TLIndicatorPath } from '@tldraw/editor'

export const STICKY_COLORS = {
  yellow: { bg: '#FFF176', border: '#F9A825', text: '#212121' },
  orange: { bg: '#FFCC80', border: '#EF6C00', text: '#212121' },
  pink: { bg: '#F48FB1', border: '#C2185B', text: '#212121' },
  red: { bg: '#EF9A9A', border: '#C62828', text: '#212121' },
  purple: { bg: '#CE93D8', border: '#6A1B9A', text: '#212121' },
  blue: { bg: '#90CAF9', border: '#1565C0', text: '#212121' },
  cyan: { bg: '#80DEEA', border: '#00838F', text: '#212121' },
  teal: { bg: '#80CBC4', border: '#00695C', text: '#212121' },
  green: { bg: '#A5D6A7', border: '#2E7D32', text: '#212121' },
  lime: { bg: '#E6EE9C', border: '#827717', text: '#212121' },
  white: { bg: '#FAFAFA', border: '#9E9E9E', text: '#212121' },
  gray: { bg: '#B0BEC5', border: '#37474F', text: '#212121' },
} as const

export type StickyColor = keyof typeof STICKY_COLORS

interface StickyNoteShapeProps {
  w: number
  h: number
  color: StickyColor
  text: string
  authorName: string
}

// Register custom shape type in tldraw's global shape map
declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    'sticky-note': StickyNoteShapeProps
  }
}

// Extract the shape type from the global TLShape union after augmentation
export type StickyNoteShape = Extract<TLShape, { type: 'sticky-note' }>

const stickyNoteShapeProps: RecordProps<StickyNoteShape> = {
  w: T.number,
  h: T.number,
  color: T.string as T.Validatable<StickyColor>,
  text: T.string,
  authorName: T.string,
}

export type StickyNoteShapePropsType = RecordPropsType<typeof stickyNoteShapeProps>

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

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: isEditing ? 'text' : 'default',
        }}
      >
        {/* 상단 색상 바 */}
        <div
          style={{
            height: 8,
            backgroundColor: colors.border,
            flexShrink: 0,
          }}
        />
        {/* 텍스트 영역 */}
        <div
          style={{
            flex: 1,
            padding: '8px 10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <textarea
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              lineHeight: 1.5,
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
          {/* 작성자 표시 */}
          {shape.props.authorName && (
            <div
              style={{
                fontSize: 11,
                color: colors.border,
                textAlign: 'right',
                flexShrink: 0,
                fontWeight: 500,
              }}
            >
              {shape.props.authorName}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: StickyNoteShape): TLIndicatorPath | undefined {
    const { w, h } = shape.props
    const r = 8
    return new Path2D(
      `M ${r},0 H ${w - r} Q ${w},0 ${w},${r} V ${h - r} Q ${w},${h} ${w - r},${h} H ${r} Q 0,${h} 0,${h - r} V ${r} Q 0,0 ${r},0 Z`
    )
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
