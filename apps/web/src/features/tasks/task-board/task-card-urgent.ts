/** Flame flicker — used by the urgent indicator on cards and lists. */
export const TASK_URGENT_FLAME_MOTION_CLASS = 'nbos-task-flame-flicker';

const TASK_URGENT_FLAME_SIZE_STEP = 1.3;
const TASK_CARD_URGENT_FLAME_SIZE_BASE = 12;
const TASK_LIST_URGENT_FLAME_SIZE_BASE = 14;

/** Board card flame — 30% larger than the original mark. */
export const TASK_CARD_URGENT_FLAME_SIZE = Math.round(
  TASK_CARD_URGENT_FLAME_SIZE_BASE * TASK_URGENT_FLAME_SIZE_STEP,
);

/** List-row flame — 30% larger than the original mark. */
export const TASK_LIST_URGENT_FLAME_SIZE = Math.round(
  TASK_LIST_URGENT_FLAME_SIZE_BASE * TASK_URGENT_FLAME_SIZE_STEP,
);
