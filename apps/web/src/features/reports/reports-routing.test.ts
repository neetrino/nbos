import { describe, expect, it } from 'vitest';
import { buildReportsViewPath, parseReportsPathname } from '@/features/reports/reports-routing';

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
  });
});
