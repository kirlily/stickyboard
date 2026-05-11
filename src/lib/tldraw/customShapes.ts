// tldraw 커스텀 Shape 등록 목록
import { StickyNoteShapeUtil } from './stickyNoteShape'
import { TimerShapeUtil } from './timerShape'
import { PollShapeUtil } from './pollShape'
import { SectionShapeUtil } from './sectionShape'

export const customShapeUtils = [
  StickyNoteShapeUtil,
  TimerShapeUtil,
  PollShapeUtil,
  SectionShapeUtil,
]

export type { StickyNoteShape, StickyColor } from './stickyNoteShape'
export { STICKY_COLORS, createStickyNote } from './stickyNoteShape'
export { createTimer } from './timerShape'
export { createPoll } from './pollShape'
export { createSection } from './sectionShape'
export type { SectionColor } from './sectionShape'
