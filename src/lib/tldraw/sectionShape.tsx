// 보드 영역을 구분하는 섹션 프레임 ShapeUtil — FigJam 스타일 라벨 pill
'use client'

import { BaseBoxShapeUtil, HTMLContainer, T, TLBaseShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'
import { useState } from 'react'

export type SectionColor = 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'gray'

interface SectionShapeProps {
  w: number
  h: number
  title: string
  color: string
}

export type SectionShape = TLBaseShape<'section', SectionShapeProps>

const sectionShapeProps: RecordProps<SectionShape> = {
  w: T.number,
  h: T.number,
  title: T.string,
  color: T.string,
}

const SECTION_COLORS: Record<
  SectionColor,
  { bg: string; border: string; text: string; pill: string }
> = {
  blue: {
    bg: 'rgba(59,130,246,0.05)',
    border: 'rgba(59,130,246,0.28)',
    text: '#2563EB',
    pill: 'rgba(59,130,246,0.12)',
  },
  purple: {
    bg: 'rgba(139,92,246,0.05)',
    border: 'rgba(139,92,246,0.28)',
    text: '#7C3AED',
    pill: 'rgba(139,92,246,0.12)',
  },
  green: {
    bg: 'rgba(16,185,129,0.05)',
    border: 'rgba(16,185,129,0.28)',
    text: '#059669',
    pill: 'rgba(16,185,129,0.12)',
  },
  yellow: {
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.28)',
    text: '#B45309',
    pill: 'rgba(245,158,11,0.15)',
  },
  pink: {
    bg: 'rgba(236,72,153,0.05)',
    border: 'rgba(236,72,153,0.28)',
    text: '#BE185D',
    pill: 'rgba(236,72,153,0.12)',
  },
  gray: {
    bg: 'rgba(107,114,128,0.05)',
    border: 'rgba(107,114,128,0.28)',
    text: '#374151',
    pill: 'rgba(107,114,128,0.12)',
  },
}

const DEFAULT_COLOR: SectionColor = 'blue'

function getColors(color: string) {
  return SECTION_COLORS[
    (color as SectionColor) in SECTION_COLORS ? (color as SectionColor) : DEFAULT_COLOR
  ]
}

function SectionDisplay({
  shape,
  onUpdate,
}: {
  shape: SectionShape
  onUpdate: (props: Partial<SectionShapeProps>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(shape.props.title)
  const c = getColors(shape.props.color)

  return (
    <div
      style={{
        width: shape.props.w,
        height: shape.props.h,
        backgroundColor: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 16,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 타이틀 pill — 테두리 위에 걸쳐 표시 */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          left: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: c.pill,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: '2px 8px 2px 10px',
          pointerEvents: 'all',
          backdropFilter: 'blur(8px)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={() => {
          setEditing(true)
          setDraft(shape.props.title)
        }}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onUpdate({ title: draft })
              setEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdate({ title: draft })
                setEditing(false)
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: c.text,
              width: 100,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: c.text,
              userSelect: 'none',
              whiteSpace: 'nowrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
            }}
          >
            {shape.props.title || '섹션'}
          </span>
        )}

        {/* 색상 선택 도트 */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
          {(Object.keys(SECTION_COLORS) as SectionColor[]).map((col) => (
            <button
              key={col}
              onClick={() => onUpdate({ color: col })}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: SECTION_COLORS[col].text,
                border:
                  shape.props.color === col
                    ? `2px solid ${SECTION_COLORS[col].text}`
                    : '1.5px solid transparent',
                outline: shape.props.color === col ? '1.5px solid white' : 'none',
                outlineOffset: -2,
                cursor: 'pointer',
                padding: 0,
                opacity: shape.props.color === col ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export class SectionShapeUtil extends BaseBoxShapeUtil<SectionShape> {
  static override type = 'section' as const
  static override props = sectionShapeProps

  override getDefaultProps(): SectionShape['props'] {
    return { w: 640, h: 420, title: '섹션', color: 'blue' }
  }

  override canResize() {
    return true
  }

  override component(shape: SectionShape) {
    return (
      <HTMLContainer id={shape.id}>
        <SectionDisplay
          shape={shape}
          onUpdate={(props) => {
            this.editor.updateShape<SectionShape>({ id: shape.id, type: 'section', props })
          }}
        />
      </HTMLContainer>
    )
  }

  override indicator(shape: SectionShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />
  }
}

export function createSection(
  options: { x?: number; y?: number; color?: SectionColor; title?: string } = {}
) {
  const { x = 0, y = 0, color = 'blue', title = '섹션' } = options
  return {
    id: createShapeId(),
    type: 'section' as const,
    x,
    y,
    props: { w: 640, h: 420, title, color },
  }
}
