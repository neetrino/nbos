import { describe, expect, it } from 'vitest';
import { financeReportStatusLabel } from './finance-report-status';

describe('financeReportStatusLabel', () => {
  it('labels report definition readiness states', () => {
    expect(financeReportStatusLabel('definition_ready')).toBe('Definition ready');
    expect(financeReportStatusLabel('partial_sources')).toBe('Partial sources');
    expect(financeReportStatusLabel('needs_aggregate_endpoint')).toBe('Needs aggregate endpoint');
  });
});
