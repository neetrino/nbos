import { describe, expect, it } from 'vitest';
import {
  buildPartnersScopeStatsCsvContent,
  type PartnersScopeStatsCsvMeta,
} from '@/features/partners/utils/export-partners-scope-stats-csv';
import type { PartnerStats } from '@/lib/api/partners';

const META: PartnersScopeStatsCsvMeta = {
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE_STATS: PartnerStats = {
  total: 12,
  totalSubscriptions: 40,
  avgPayoutPercent: 15.25,
};

describe('buildPartnersScopeStatsCsvContent', () => {
  it('includes header meta scope_note and totals', () => {
    const csv = buildPartnersScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines.some((l) => l.startsWith('meta,exportedAt,'))).toBe(true);
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,total,12,,,');
    expect(lines).toContain('totals,totalSubscriptions,40,,,');
    expect(lines).toContain('totals,avgPayoutPercent,15.25,,,');
  });
});
