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

  it('appends grand total row aligned with cent roll-ups', () => {
    const row2: BonusProjectPoolRow = {
      projectId: 'p2',
      projectCode: 'B',
      projectName: 'Beta',
      entryCount: 2,
      sumTotalAmount: '200.00',
      sumPipelineAmount: '100.00',
      sumPaidAmount: '50.00',
      sumClawbackAmount: '50.00',
    };
    const csv = buildBonusProjectPoolsCsvContent([sample, row2]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All projects (2)');
    expect(lines[3]).toMatch(/,5,700\.00,/);
    expect(lines[3]).toContain('700.00');
    expect(lines[3]).toContain('350.00');
    expect(lines[3]).toContain('150.00');
    expect(lines[3]).toContain('1200.00');
  });
});
