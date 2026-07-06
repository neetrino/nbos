/** Meta row: label + gap + value + horizontal sheet padding (px-5 × 2). */
const META_LABEL_PX = 8.25 * 16;
const META_VALUE_PX = 15.5 * 16;
const META_ROW_GAP_PX = 12;
const SHEET_COLUMN_PADDING_PX = 40;

/** Minimum detail column width so label/value rows stay on one line. */
export const TASK_SHEET_DETAIL_MIN_PX =
  META_LABEL_PX + META_VALUE_PX + META_ROW_GAP_PX + SHEET_COLUMN_PADDING_PX;

/** Minimum chat column width (header + composer). */
export const TASK_SHEET_CHAT_MIN_PX = 300;

import { TASK_SHEET_VIEWPORT_WIDTH_FRACTION } from './task-sheet-classes';

/** Minimum viewport width for detail+chat row at {@link TASK_SHEET_VIEWPORT_WIDTH_FRACTION}. */
export const TASK_SHEET_SPLIT_ROW_MIN_VIEWPORT_PX = Math.ceil(
  (TASK_SHEET_DETAIL_MIN_PX + TASK_SHEET_CHAT_MIN_PX) / TASK_SHEET_VIEWPORT_WIDTH_FRACTION,
);

export const TASK_SHEET_DETAIL_RATIO_MIN = 0.3;
export const TASK_SHEET_DETAIL_RATIO_MAX = 0.7;
export const TASK_SHEET_DETAIL_RATIO_DEFAULT = 0.5;

export const TASK_SHEET_SPLIT_STORAGE_KEY = 'nbos.task-sheet.detail-ratio';

/** Wider hit target than the visible grip (px). */
export const TASK_SHEET_SPLIT_HIT_PX = 10;
