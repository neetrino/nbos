import { describe, expect, it } from 'vitest';
import {
  isReportsNavItemVisible,
  REPORTS_CENTER_NAV,
  resolveReportsZoneNav,
} from '@/features/reports/reports-module-nav';

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

describe('Sales pill visibility', () => {
  const allow = (modules: string[]) => (action: string, module: string) =>
    action === 'VIEW' && modules.includes(module);

  it('shows Sales when the reader has leads or deals', () => {
    expect(isReportsNavItemVisible('/reports/growth/sales', allow(['CRM_LEADS']))).toBe(true);
    expect(isReportsNavItemVisible('/reports/growth/sales', allow(['CRM_DEALS']))).toBe(true);
  });

  it('hides Sales from roles without any CRM read', () => {
    expect(isReportsNavItemVisible('/reports/growth/sales', allow(['DASHBOARDS']))).toBe(false);
  });

  it('leaves pills without a permission requirement alone', () => {
    expect(isReportsNavItemVisible('/reports/growth/marketing', allow([]))).toBe(true);
  });

  it('drops the growth pills entirely when only Marketing remains', () => {
    expect(resolveReportsZoneNav('/reports/growth/marketing', allow(['DASHBOARDS']))).toBeNull();
  });
});
