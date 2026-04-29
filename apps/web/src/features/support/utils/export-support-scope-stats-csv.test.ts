import { describe, expect, it } from 'vitest';
import {
  buildSupportScopeStatsCsvContent,
  type SupportScopeStatsCsvMeta,
} from '@/features/support/utils/export-support-scope-stats-csv';
import type { SupportStats } from '@/lib/api/support';

const META: SupportScopeStatsCsvMeta = {
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE: SupportStats = {
  byStatus: [
    { status: 'OPEN', _count: 3 },
    { status: 'CLOSED', _count: 1 },
  ],
  byPriority: [{ priority: 'P1', _count: 2 }],
  byCategory: [{ category: 'BUG', _count: 4 }],
};

describe('buildSupportScopeStatsCsvContent', () => {
  it('includes meta totals and breakdown sections', () => {
    const csv = buildSupportScopeStatsCsvContent(SAMPLE, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,ticketsCountedByStatus,4,,,');
    expect(lines).toContain('by_status,OPEN,3,,,');
    expect(lines).toContain('by_priority,P1,2,,,');
    expect(lines).toContain('by_category,BUG,4,,,');
  });
});
