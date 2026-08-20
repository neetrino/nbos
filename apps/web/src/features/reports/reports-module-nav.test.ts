import { describe, expect, it } from 'vitest';
import { REPORTS_CENTER_NAV, resolveReportsZoneNav } from '@/features/reports/reports-module-nav';

describe('REPORTS_CENTER_NAV', () => {
  it('shows scheduled, report files and quality', () => {
    expect(REPORTS_CENTER_NAV.map((item) => item.href)).toEqual([
      '/reports/center/scheduled',
      '/reports/center/exports',
      '/reports/center/quality',
    ]);
    expect(REPORTS_CENTER_NAV[0]?.label).toBe('Scheduled');
    expect(REPORTS_CENTER_NAV[1]?.label).toBe('Report files');
  });
});

describe('resolveReportsZoneNav', () => {
  it('returns center pills on report files', () => {
    const nav = resolveReportsZoneNav('/reports/center/exports');
    expect(nav).toEqual(REPORTS_CENTER_NAV);
  });

  it('hides finance pills when the zone has only one tab', () => {
    expect(resolveReportsZoneNav('/reports/finance')).toBeNull();
  });
});
