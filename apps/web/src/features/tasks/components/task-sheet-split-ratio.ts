import {
  TASK_SHEET_CHAT_MIN_PX,
  TASK_SHEET_DETAIL_MIN_PX,
  TASK_SHEET_DETAIL_RATIO_DEFAULT,
  TASK_SHEET_DETAIL_RATIO_MAX,
  TASK_SHEET_DETAIL_RATIO_MIN,
  TASK_SHEET_SPLIT_STORAGE_KEY,
} from './task-sheet-split-constants';

/** Clamps detail share to 30–70% and content-safe pixel floors. */
export function clampTaskSheetDetailRatio(ratio: number, containerWidthPx: number): number {
  if (containerWidthPx <= 0) return TASK_SHEET_DETAIL_RATIO_DEFAULT;

  const minFromRatio = TASK_SHEET_DETAIL_RATIO_MIN;
  const maxFromRatio = TASK_SHEET_DETAIL_RATIO_MAX;
  const minFromDetailPx = TASK_SHEET_DETAIL_MIN_PX / containerWidthPx;
  const maxFromChatPx = 1 - TASK_SHEET_CHAT_MIN_PX / containerWidthPx;

  const min = Math.max(minFromRatio, minFromDetailPx);
  const max = Math.min(maxFromRatio, maxFromChatPx);

  if (min > max) return Math.min(maxFromRatio, Math.max(minFromRatio, ratio));

  return Math.min(max, Math.max(min, ratio));
}

export function readStoredTaskSheetDetailRatio(): number {
  if (typeof window === 'undefined') return TASK_SHEET_DETAIL_RATIO_DEFAULT;

  try {
    const raw = window.localStorage.getItem(TASK_SHEET_SPLIT_STORAGE_KEY);
    if (raw == null) return TASK_SHEET_DETAIL_RATIO_DEFAULT;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return TASK_SHEET_DETAIL_RATIO_DEFAULT;
    return clampTaskSheetDetailRatio(parsed, window.innerWidth);
  } catch {
    return TASK_SHEET_DETAIL_RATIO_DEFAULT;
  }
}

export function persistTaskSheetDetailRatio(ratio: number): void {
  try {
    window.localStorage.setItem(TASK_SHEET_SPLIT_STORAGE_KEY, String(ratio));
  } catch {
    /* storage unavailable */
  }
}
