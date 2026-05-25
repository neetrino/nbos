import { BadRequestException } from '@nestjs/common';

import {
  KPI_SCORECARD_PERIODS,
  type KpiScorecardMetric,
  type KpiScorecardPayrollField,
} from './kpi-scorecard-metrics.types';

const PAYROLL_FIELDS = new Set<KpiScorecardPayrollField>([
  'kpiSalesPlanAmount',
  'kpiSalesActualAmount',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOneMetric(raw: unknown, index: number): KpiScorecardMetric {
  if (!isRecord(raw)) {
    throw new BadRequestException(`scorecardMetrics[${index}] must be an object`);
  }
  const code = typeof raw.code === 'string' ? raw.code.trim() : '';
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  if (code.length < 2 || code.length > 40) {
    throw new BadRequestException(`scorecardMetrics[${index}].code must be 2–40 characters`);
  }
  if (label.length < 2 || label.length > 120) {
    throw new BadRequestException(`scorecardMetrics[${index}].label must be 2–120 characters`);
  }
  const period = raw.period;
  if (
    typeof period !== 'string' ||
    !KPI_SCORECARD_PERIODS.includes(period as KpiScorecardMetric['period'])
  ) {
    throw new BadRequestException(
      `scorecardMetrics[${index}].period must be one of ${KPI_SCORECARD_PERIODS.join(', ')}`,
    );
  }
  const description =
    typeof raw.description === 'string' && raw.description.trim() !== ''
      ? raw.description.trim()
      : undefined;
  const payrollField = raw.payrollField;
  if (payrollField != null) {
    if (
      typeof payrollField !== 'string' ||
      !PAYROLL_FIELDS.has(payrollField as KpiScorecardPayrollField)
    ) {
      throw new BadRequestException(
        `scorecardMetrics[${index}].payrollField must be kpiSalesPlanAmount or kpiSalesActualAmount`,
      );
    }
  }
  return {
    code,
    label,
    period: period as KpiScorecardMetric['period'],
    description,
    payrollField: payrollField as KpiScorecardPayrollField | undefined,
  };
}

export function parseKpiScorecardMetrics(raw: unknown): KpiScorecardMetric[] {
  if (raw == null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new BadRequestException('scorecardMetrics must be an array');
  }
  return raw.map((item, index) => parseOneMetric(item, index));
}
