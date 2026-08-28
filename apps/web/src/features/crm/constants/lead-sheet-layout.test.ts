import { describe, expect, it } from 'vitest';
import {
  LEAD_DETAIL_SHEET_RAIL_ANCHOR_CLASS,
  LEAD_DETAIL_SHEET_WIDTH_CLASS,
} from './lead-sheet-layout';

describe('lead-sheet-layout', () => {
  it('caps sheet width and keeps rail anchor in sync', () => {
    expect(LEAD_DETAIL_SHEET_WIDTH_CLASS).toContain('min(48rem,calc(100vw-2rem-2.75rem))');
    expect(LEAD_DETAIL_SHEET_RAIL_ANCHOR_CLASS).toContain('min(48rem,calc(100vw-2rem-2.75rem))');
    expect(LEAD_DETAIL_SHEET_WIDTH_CLASS).toContain('min-w-0');
  });
});
