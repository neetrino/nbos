import { describe, expect, it } from 'vitest';
import { reportViewLabel } from './ReportsCenterChrome';

describe('reportViewLabel', () => {
  it('names the files shelf Report files', () => {
    expect(reportViewLabel('EXPORTS')).toBe('Report files');
    expect(reportViewLabel('QUALITY')).toBe('Data quality');
    expect(reportViewLabel('FINANCE')).toBe('Finance');
  });
});
