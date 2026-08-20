import { describe, expect, it } from 'vitest';
import {
  REPORTS_CENTER_NAV,
  resolveReportsZoneNav,
} from '@/features/reports/reports-module-nav';

describe('REPORTS_CENTER_NAV', () => {
  it('shows report files and quality, not scheduled', () => {
    expect(REPORTS_CENTER_NAV.map((item) => item.href)).toEqual([
      '/reports/center/exports',
      '/reports/center/quality',
    ]);
    expect(REPORTS_CENTER_NAV.some((item) => item.href.includes('scheduled'))).toBe(false);
    expect(REPORTS_CENTER_NAV[0]?.label).toBe('Report files');
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
