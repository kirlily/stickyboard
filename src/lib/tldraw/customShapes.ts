// tldraw 커스텀 Shape 등록 목록
import { StickyNoteShapeUtil } from './stickyNoteShape'
import { TimerShapeUtil } from './timerShape'
import { PollShapeUtil } from './pollShape'

export const customShapeUtils = [StickyNoteShapeUtil, TimerShapeUtil, PollShapeUtil]

export type { StickyNoteShape, StickyColor } from './stickyNoteShape'
export { STICKY_COLORS, createStickyNote } from './stickyNoteShape'
export { createTimer } from './timerShape'
export { createPoll } from './pollShape'
