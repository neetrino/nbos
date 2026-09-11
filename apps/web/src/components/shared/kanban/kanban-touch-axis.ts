export const KANBAN_TOUCH_AXIS_LOCK_PX = 8;

export type KanbanTouchAxis = 'undecided' | 'x' | 'y';

/** Lock the pan axis once the finger has moved past the slop. */
export function resolveKanbanTouchAxis(dx: number, dy: number, lockPx: number): KanbanTouchAxis {
  if (Math.abs(dx) < lockPx && Math.abs(dy) < lockPx) return 'undecided';
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}

/** Finger-follow board pan. `dx` is touch delta (right is positive). */
export function nextKanbanBoardScrollLeft(
  startScroll: number,
  dx: number,
  maxScroll: number,
): number {
  if (maxScroll <= 0) return 0;
  return Math.min(maxScroll, Math.max(0, startScroll - dx));
}
