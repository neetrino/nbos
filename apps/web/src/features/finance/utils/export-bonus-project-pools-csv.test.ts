import { describe, expect, it } from 'vitest';
import { buildBonusProjectPoolsCsvContent } from './export-bonus-project-pools-csv';
import type { BonusProjectPoolRow } from '@/lib/api/bonus';

const sample: BonusProjectPoolRow = {
  projectId: 'p1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 3,
  sumTotalAmount: '1000.00',
  sumPipelineAmount: '600.00',
  sumPaidAmount: '300.00',
  sumClawbackAmount: '100.00',
};

describe('buildBonusProjectPoolsCsvContent', () => {
  it('includes header and row', () => {
    const csv = buildBonusProjectPoolsCsvContent([sample]);
    expect(csv).toContain('projectId');
    expect(csv).toContain('p1');
    expect(csv).toContain('Alpha');
    expect(csv).toContain('1000.00');
  });

  it('returns header only when empty', () => {
    expect(buildBonusProjectPoolsCsvContent([])).toBe(
      'projectId,projectCode,projectName,entryCount,sumPipelineAmount,sumPaidAmount,sumClawbackAmount,sumTotalAmount',
    );
  });
});
