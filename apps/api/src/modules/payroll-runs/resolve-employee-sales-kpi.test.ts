import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { BadRequestException } from '@nestjs/common';

import {
  assertEmployeeSalesKpiComplete,
  resolveEmployeeSalesKpi,
  resolveSalesKpiFactorForEmployee,
  salesKpiPayoutFactorFromSnapshot,
} from './resolve-employee-sales-kpi';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';
import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';

describe('resolveEmployeeSalesKpi', () => {
  it('uses run defaults when line has no override', () => {
    const r = resolveEmployeeSalesKpi(
      { kpiSalesPlanAmount: null, kpiSalesActualAmount: null },
      { kpiSalesPlanAmount: new Decimal(1000), kpiSalesActualAmount: new Decimal(700) },
    );
    expect(r.source).toBe('RUN_DEFAULT');
    expect(r.kpiSalesPlanAmount?.toString()).toBe('1000');
  });

  it('uses line override with run fallback for missing side', () => {
    const r = resolveEmployeeSalesKpi(
      { kpiSalesPlanAmount: new Decimal(500), kpiSalesActualAmount: null },
      { kpiSalesPlanAmount: new Decimal(1000), kpiSalesActualAmount: new Decimal(400) },
    );
    expect(r.source).toBe('LINE_OVERRIDE');
    expect(r.kpiSalesActualAmount?.toString()).toBe('400');
  });
});

describe('salesKpiPayoutFactorFromSnapshot', () => {
  it('applies gate rules to resolved snapshot', () => {
    const f = salesKpiPayoutFactorFromSnapshot(
      {
        kpiSalesPlanAmount: new Decimal(1000),
        kpiSalesActualAmount: new Decimal(600),
      },
      DEFAULT_KPI_GATE_RULES,
    );
    expect(f.toString()).toBe('0.5');
  });
});

describe('resolveSalesKpiFactorForEmployee', () => {
  const policy = {
    gateRules: DEFAULT_KPI_GATE_RULES,
    bonusCapBaseSalaryMultiplier: new Decimal(1),
  } as CompensationPayrollPolicy;

  it('prefers line override over run for SALES', () => {
    const cache = new Map();
    const factor = resolveSalesKpiFactorForEmployee({
      employeeId: 'e1',
      bonusType: 'SALES',
      line: {
        kpiSalesPlanAmount: new Decimal(500),
        kpiSalesActualAmount: new Decimal(500),
      },
      runKpiSnapshot: {
        kpiSalesPlanAmount: new Decimal(1000),
        kpiSalesActualAmount: new Decimal(600),
      },
      payrollPolicy: policy,
      cache,
    });
    expect(factor.toString()).toBe('1');
  });
});

describe('assertEmployeeSalesKpiComplete', () => {
  it('throws when only plan is set', () => {
    expect(() =>
      assertEmployeeSalesKpiComplete({
        kpiSalesPlanAmount: new Decimal(100),
        kpiSalesActualAmount: null,
      }),
    ).toThrow(BadRequestException);
  });
});
