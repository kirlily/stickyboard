// 보드 영역을 구분하는 섹션 프레임 ShapeUtil — 발표 모드와 연동
'use client'

import { BaseBoxShapeUtil, HTMLContainer, T, TLShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'
import type { TLIndicatorPath } from '@tldraw/editor'
import { useState } from 'react'

export type SectionColor = 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'gray'

interface SectionShapeProps {
  w: number
  h: number
  title: string
  color: string
}

declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    section: SectionShapeProps
  }
}

export type SectionShape = Extract<TLShape, { type: 'section' }>

const sectionShapeProps: RecordProps<SectionShape> = {
  w: T.number,
  h: T.number,
  title: T.string,
  color: T.string,
}

const SECTION_COLORS: Record<SectionColor, { bg: string; border: string; text: string }> = {
  blue: { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.45)', text: '#1d4ed8' },
  purple: { bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.45)', text: '#6d28d9' },
  green: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.45)', text: '#065f46' },
  yellow: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.45)', text: '#92400e' },
  pink: { bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.45)', text: '#9d174d' },
  gray: { bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.45)', text: '#374151' },
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
        border: `2px dashed ${c.border}`,
        borderRadius: 12,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 타이틀 바 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '5px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'all',
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
              outline: `1px solid ${c.border}`,
              borderRadius: 4,
              padding: '0 4px',
              fontSize: 13,
              fontWeight: 700,
              color: c.text,
              flex: 1,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: c.text,
              userSelect: 'none',
              flex: 1,
            }}
          >
            {shape.props.title || '섹션'}
          </span>
        )}

        {/* 색상 선택 도트 */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(Object.keys(SECTION_COLORS) as SectionColor[]).map((col) => (
            <button
              key={col}
              onClick={() => onUpdate({ color: col })}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: SECTION_COLORS[col].border,
                border: shape.props.color === col ? '2px solid #1a1a1a' : '1px solid transparent',
                cursor: 'pointer',
                padding: 0,
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

  override getIndicatorPath(shape: SectionShape): TLIndicatorPath | undefined {
    const { w, h } = shape.props
    const r = 12
    return new Path2D(
      `M ${r},0 H ${w - r} Q ${w},0 ${w},${r} V ${h - r} Q ${w},${h} ${w - r},${h} H ${r} Q 0,${h} 0,${h - r} V ${r} Q 0,0 ${r},0 Z`
    )
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
