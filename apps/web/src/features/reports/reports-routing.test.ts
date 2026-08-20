import { describe, expect, it } from 'vitest';
import {
  buildReportsViewPath,
  isLiveReportsCenterSlug,
  isReportDataView,
  parseReportsPathname,
} from '@/features/reports/reports-routing';

describe('parseReportsPathname', () => {
  it('parses finance overview', () => {
    expect(parseReportsPathname('/reports/finance')).toEqual({
      sectionId: 'finance',
      viewId: 'FINANCE',
    });
  });

  it('parses growth and delivery views', () => {
    expect(parseReportsPathname('/reports/growth/sales')).toEqual({
      sectionId: 'growth',
      viewId: 'SALES',
    });
    expect(parseReportsPathname('/reports/delivery/specialists')).toEqual({
      sectionId: 'delivery',
      viewId: 'SPECIALISTS',
    });
  });

  it('parses report center views', () => {
    expect(parseReportsPathname('/reports/center/exports')).toEqual({
      sectionId: 'center',
      viewId: 'EXPORTS',
    });
    expect(parseReportsPathname('/reports/center/scheduled')).toEqual({
      sectionId: 'center',
      viewId: 'SCHEDULED',
    });
  });

  it('rejects unknown paths', () => {
    expect(parseReportsPathname('/reports')).toBeNull();
    expect(parseReportsPathname('/reports/unknown/sales')).toBeNull();
    expect(parseReportsPathname('/reports/growth/exports')).toBeNull();
  });
});

describe('buildReportsViewPath', () => {
  it('builds canonical zone paths', () => {
    expect(buildReportsViewPath('FINANCE')).toBe('/reports/finance');
    expect(buildReportsViewPath('MARKETING')).toBe('/reports/growth/marketing');
    expect(buildReportsViewPath('QUALITY')).toBe('/reports/center/quality');
    expect(buildReportsViewPath('EXPORTS')).toBe('/reports/center/exports');
  });
});

describe('isLiveReportsCenterSlug', () => {
  it('keeps scheduled, exports and quality mounted', () => {
    expect(isLiveReportsCenterSlug('scheduled')).toBe(true);
    expect(isLiveReportsCenterSlug('exports')).toBe(true);
    expect(isLiveReportsCenterSlug('quality')).toBe(true);
    expect(isLiveReportsCenterSlug('unknown')).toBe(false);
  });
});

describe('isReportDataView', () => {
  it('is true only for report tabs that can create a file', () => {
    expect(isReportDataView('FINANCE')).toBe(true);
    expect(isReportDataView('SALES')).toBe(true);
    expect(isReportDataView('EXPORTS')).toBe(false);
    expect(isReportDataView('SCHEDULED')).toBe(false);
    expect(isReportDataView('QUALITY')).toBe(false);
  });
});
