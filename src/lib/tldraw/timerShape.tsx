// 타이머 위젯 ShapeUtil — 원형 SVG 카운트다운, 시작/일시정지/리셋 버튼
import { BaseBoxShapeUtil, HTMLContainer, T, TLBaseShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'
import { useState, useEffect } from 'react'

interface TimerShapeProps {
  w: number
  h: number
  duration: number
  startedAt: string
  elapsed: number
}

export type TimerShape = TLBaseShape<'timer', TimerShapeProps>

const timerShapeProps: RecordProps<TimerShape> = {
  w: T.number,
  h: T.number,
  duration: T.number,
  startedAt: T.string,
  elapsed: T.number,
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function TimerDisplay({
  shape,
  onUpdate,
}: {
  shape: TimerShape
  onUpdate: (props: Partial<TimerShapeProps>) => void
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!shape.props.startedAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [shape.props.startedAt])

  const isRunning = !!shape.props.startedAt
  const startMs = shape.props.startedAt ? new Date(shape.props.startedAt).getTime() : 0
  const currentElapsed = isRunning
    ? shape.props.elapsed + (now - startMs) / 1000
    : shape.props.elapsed
  const remaining = Math.max(0, shape.props.duration - currentElapsed)
  const isDone = remaining <= 0

  const progress = isDone ? 0 : remaining / shape.props.duration
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  function handleStart() {
    onUpdate({ startedAt: new Date().toISOString() })
  }

  function handlePause() {
    const pausedElapsed =
      shape.props.elapsed + (now - new Date(shape.props.startedAt).getTime()) / 1000
    onUpdate({ startedAt: '', elapsed: pausedElapsed })
  }

  function handleReset() {
    onUpdate({ startedAt: '', elapsed: 0 })
  }

  const strokeColor = isDone ? '#EF4444' : isRunning ? '#3B82F6' : '#6B7280'

  return (
    <div
      style={{
        width: shape.props.w,
        height: shape.props.h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        border: '2px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        userSelect: 'none',
      }}
    >
      {/* 원형 진행 바 */}
      <svg width={RADIUS * 2 + 16} height={RADIUS * 2 + 16}>
        <circle
          cx={RADIUS + 8}
          cy={RADIUS + 8}
          r={RADIUS}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={8}
        />
        <circle
          cx={RADIUS + 8}
          cy={RADIUS + 8}
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RADIUS + 8} ${RADIUS + 8})`}
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
        <text
          x={RADIUS + 8}
          y={RADIUS + 8}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fontWeight={600}
          fill={isDone ? '#EF4444' : '#111827'}
          fontFamily="monospace"
        >
          {formatTime(remaining)}
        </text>
      </svg>

      {/* 컨트롤 버튼 */}
      <div
        style={{ display: 'flex', gap: 8, pointerEvents: 'all' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!isDone && !isRunning && (
          <button
            onClick={handleStart}
            style={{
              padding: '4px 14px',
              borderRadius: 8,
              background: '#3B82F6',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            시작
          </button>
        )}
        {isRunning && (
          <button
            onClick={handlePause}
            style={{
              padding: '4px 14px',
              borderRadius: 8,
              background: '#F59E0B',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            일시정지
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            padding: '4px 14px',
            borderRadius: 8,
            background: '#F3F4F6',
            color: '#374151',
            border: '1px solid #D1D5DB',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          리셋
        </button>
      </div>

      {/* 시간 설정 (멈춤 상태에서만) */}
      {!isRunning && (
        <div
          style={{ display: 'flex', gap: 6, pointerEvents: 'all' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {[1, 3, 5, 10].map((min) => (
            <button
              key={min}
              onClick={() => onUpdate({ duration: min * 60, elapsed: 0, startedAt: '' })}
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: shape.props.duration === min * 60 ? '#3B82F6' : '#F9FAFB',
                color: shape.props.duration === min * 60 ? '#fff' : '#6B7280',
                border: `1px solid ${shape.props.duration === min * 60 ? '#3B82F6' : '#D1D5DB'}`,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {min}분
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export class TimerShapeUtil extends BaseBoxShapeUtil<TimerShape> {
  static override type = 'timer' as const
  static override props = timerShapeProps

  override getDefaultProps(): TimerShape['props'] {
    return { w: 200, h: 220, duration: 300, startedAt: '', elapsed: 0 }
  }

  override canResize() {
    return false
  }

  override component(shape: TimerShape) {
    return (
      <HTMLContainer id={shape.id}>
        <TimerDisplay
          shape={shape}
          onUpdate={(props) => {
            this.editor.updateShape<TimerShape>({ id: shape.id, type: 'timer', props })
          }}
        />
      </HTMLContainer>
    )
  }

  override indicator(shape: TimerShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />
  }
}

export function createTimer(options: { x?: number; y?: number; duration?: number } = {}) {
  const { x = 0, y = 0, duration = 300 } = options
  return {
    id: createShapeId(),
    type: 'timer' as const,
    x,
    y,
    props: { w: 200, h: 220, duration, startedAt: '', elapsed: 0 },
  }
}
