// 투표 위젯 ShapeUtil — 질문, 선택지별 바 차트, 사용자 투표 추적
import { BaseBoxShapeUtil, HTMLContainer, RecordPropsType, T, TLShape, createShapeId } from 'tldraw'
import type { RecordProps } from '@tldraw/tlschema'
import type { TLIndicatorPath } from '@tldraw/editor'

interface PollShapeProps {
  w: number
  h: number
  question: string
  options: string
  userVotes: string
}

declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    poll: PollShapeProps
  }
}

export type PollShape = Extract<TLShape, { type: 'poll' }>

const pollShapeProps: RecordProps<PollShape> = {
  w: T.number,
  h: T.number,
  question: T.string,
  options: T.string,
  userVotes: T.string,
}

export type PollShapePropsType = RecordPropsType<typeof pollShapeProps>

function parseOptions(json: string): string[] {
  try {
    return JSON.parse(json) as string[]
  } catch {
    return ['옵션 1', '옵션 2']
  }
}

function parseVotes(json: string): Record<string, number> {
  try {
    return JSON.parse(json) as Record<string, number>
  } catch {
    return {}
  }
}

function PollDisplay({
  shape,
  userId,
  onUpdate,
}: {
  shape: PollShape
  userId: string
  onUpdate: (props: Partial<PollShapeProps>) => void
}) {
  const options = parseOptions(shape.props.options)
  const votes = parseVotes(shape.props.userVotes)
  const myVote = votes[userId] ?? -1

  // 옵션별 득표수
  const tally: number[] = options.map((_, i) => Object.values(votes).filter((v) => v === i).length)
  const totalVotes = tally.reduce((a, b) => a + b, 0)
  const maxTally = Math.max(...tally, 1)

  function vote(idx: number) {
    const updated = { ...votes }
    if (myVote === idx) {
      delete updated[userId]
    } else {
      updated[userId] = idx
    }
    onUpdate({ userVotes: JSON.stringify(updated) })
  }

  return (
    <div
      style={{
        width: shape.props.w,
        height: shape.props.h,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: 16,
        border: '2px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid #F3F4F6',
          background: '#F9FAFB',
        }}
      >
        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 2 }}>
          VOTE · {totalVotes}명 참여
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
          {shape.props.question}
        </div>
      </div>

      {/* 선택지 */}
      <div
        style={{
          flex: 1,
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflowY: 'auto',
          pointerEvents: 'all',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {options.map((option, i) => {
          const count = tally[i] ?? 0
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0
          const barWidth = (count / maxTally) * 100
          const isMyVote = myVote === i

          return (
            <button
              key={i}
              onClick={() => vote(i)}
              style={{
                position: 'relative',
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: `2px solid ${isMyVote ? '#3B82F6' : '#E5E7EB'}`,
                background: isMyVote ? '#EFF6FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
              }}
            >
              {/* 진행 바 배경 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${barWidth}%`,
                  background: isMyVote ? '#BFDBFE' : '#F3F4F6',
                  borderRadius: 6,
                  transition: 'width 0.3s ease',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: isMyVote ? 600 : 400, color: '#374151' }}>
                  {option}
                </span>
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
                  {count} ({Math.round(pct)}%)
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export class PollShapeUtil extends BaseBoxShapeUtil<PollShape> {
  static override type = 'poll' as const
  static override props = pollShapeProps

  override getDefaultProps(): PollShape['props'] {
    return {
      w: 260,
      h: 220,
      question: '무엇을 선택하시겠습니까?',
      options: JSON.stringify(['옵션 1', '옵션 2', '옵션 3']),
      userVotes: '{}',
    }
  }

  override canResize() {
    return false
  }

  override component(shape: PollShape) {
    // userId는 편집자 컨텍스트에서 가져올 수 없으므로 로컬 스토리지 폴백 사용
    const userId =
      typeof window !== 'undefined' ? (localStorage.getItem('poll_user_id') ?? 'anon') : 'anon'

    return (
      <HTMLContainer id={shape.id}>
        <PollDisplay
          shape={shape}
          userId={userId}
          onUpdate={(props) => {
            this.editor.updateShape<PollShape>({ id: shape.id, type: 'poll', props })
          }}
        />
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: PollShape): TLIndicatorPath | undefined {
    const { w, h } = shape.props
    const r = 16
    return new Path2D(
      `M ${r},0 H ${w - r} Q ${w},0 ${w},${r} V ${h - r} Q ${w},${h} ${w - r},${h} H ${r} Q 0,${h} 0,${h - r} V ${r} Q 0,0 ${r},0 Z`
    )
  }
}

export function createPoll(
  options: { x?: number; y?: number; question?: string; choices?: string[] } = {}
) {
  const {
    x = 0,
    y = 0,
    question = '무엇을 선택하시겠습니까?',
    choices = ['옵션 1', '옵션 2', '옵션 3'],
  } = options
  return {
    id: createShapeId(),
    type: 'poll' as const,
    x,
    y,
    props: {
      w: 260,
      h: 220,
      question,
      options: JSON.stringify(choices),
      userVotes: '{}',
    },
  }
}
