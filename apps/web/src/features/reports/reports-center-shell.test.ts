import { describe, expect, it } from 'vitest';
import type { ReportDefinition } from '@/lib/api/reports';
import { filterReportDefinitions } from './reports-center-shell';

function definition(overrides: Partial<ReportDefinition>): ReportDefinition {
  return {
    key: 'company-pnl',
    title: 'Company P&L',
    category: 'FINANCE',
    ownerModule: 'FINANCE',
    description: 'Profit and loss',
    audience: ['CEO'],
    supportedFilters: [],
    supportedExports: ['CSV'],
    visualizations: [],
    sourceEndpoints: [],
    drillDownHrefs: [],
    requiredPermissions: [],
    status: 'READY',
    dataQualityNotes: [],
    ...overrides,
  };
}

describe('filterReportDefinitions', () => {
  it('keeps the current tab and matches search', () => {
    const items = [
      definition({ key: 'pnl', title: 'Company P&L' }),
      definition({ key: 'sales', title: 'Pipeline', category: 'SALES' }),
    ];
    expect(filterReportDefinitions(items, 'FINANCE', '').map((item) => item.key)).toEqual(['pnl']);
    expect(filterReportDefinitions(items, 'FINANCE', 'pipeline')).toEqual([]);
    expect(filterReportDefinitions(items, 'FINANCE', 'p&l').map((item) => item.key)).toEqual([
      'pnl',
    ]);
  });
});
