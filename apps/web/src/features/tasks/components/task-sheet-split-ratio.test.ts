import { describe, expect, it } from 'vitest';
import { clampTaskSheetDetailRatio } from './task-sheet-split-ratio';
import {
  TASK_SHEET_DETAIL_RATIO_DEFAULT,
  TASK_SHEET_DETAIL_RATIO_MAX,
  TASK_SHEET_DETAIL_RATIO_MIN,
} from './task-sheet-split-constants';

describe('clampTaskSheetDetailRatio', () => {
  it('keeps default near 50% on wide containers', () => {
    expect(clampTaskSheetDetailRatio(0.5, 1600)).toBe(0.5);
  });

  it('clamps to 30% and 70% on wide containers', () => {
    expect(clampTaskSheetDetailRatio(0.1, 1600)).toBe(TASK_SHEET_DETAIL_RATIO_MIN);
    expect(clampTaskSheetDetailRatio(0.9, 1600)).toBe(TASK_SHEET_DETAIL_RATIO_MAX);
  });

  it('raises minimum when detail pixel floor exceeds 30%', () => {
    const width = 900;
    const ratio = clampTaskSheetDetailRatio(0.3, width);
    expect(ratio).toBeGreaterThan(TASK_SHEET_DETAIL_RATIO_MIN);
  });

  it('falls back to default when container is too narrow', () => {
    expect(clampTaskSheetDetailRatio(TASK_SHEET_DETAIL_RATIO_DEFAULT, 200)).toBe(
      TASK_SHEET_DETAIL_RATIO_DEFAULT,
    );
  });
});
