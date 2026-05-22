import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { parseKpiScorecardMetrics } from './parse-kpi-scorecard-metrics';
import { DEFAULT_SALES_SCORECARD_METRICS } from './kpi-scorecard-metrics.types';

describe('parseKpiScorecardMetrics', () => {
  it('parses default sales metrics shape', () => {
    const m = parseKpiScorecardMetrics(DEFAULT_SALES_SCORECARD_METRICS);
    expect(m.find((x) => x.code === 'REVENUE_GENERATED')?.payrollField).toBe(
      'kpiSalesActualAmount',
    );
  });

  it('rejects invalid payrollField', () => {
    expect(() =>
      parseKpiScorecardMetrics([
        { code: 'X', label: 'Bad', period: 'MONTH', payrollField: 'other' },
      ]),
    ).toThrow(BadRequestException);
  });
});
