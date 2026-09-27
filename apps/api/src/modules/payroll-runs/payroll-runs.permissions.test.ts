import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequiredPermission } from '../../common/decorators/require-permission.decorator';
import {
  expectHandlerAllowed,
  expectHandlerDenied,
  handlerNames,
  permissionOf,
} from '../finance/finance-permission-test-support';
import { FINANCE_SALARY_MODULE } from '../compensation-profiles/finance-pay-access';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
import { assertSalaryLineReadable } from './payroll-run-access';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';

const EXPECTATIONS: Record<string, RequiredPermission> = {
  findAll: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getStats: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getSalaryBoard: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getSalaryLineMonthDetail: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getAllocationMatrixValidation: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getEmployeeBonusHistoryMeta: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getEmployeeBonusHistorySlice: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  getAllocationMatrix: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  findOne: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  patchAllocationMatrixLayout: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  patchAllocationMatrixCell: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  createAllocationMatrixManualBonus: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  resetAllocationMatrixLayout: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  updateStatus: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  create: { module: FINANCE_SALARY_MODULE, action: 'ADD' },
};

const MUTATIONS = Object.entries(EXPECTATIONS)
  .filter(([, requirement]) => requirement.action !== 'VIEW')
  .map(([name]) => name);

function actor(permissions: Record<string, string>): FinancePayActor {
  return { id: 'emp-1', permissions, departmentIds: [] };
}

describe('Payroll runs permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (PayrollRunsController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(PayrollRunsController).filter(
      (name) => !permissionOf((PayrollRunsController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('does not treat VIEW as sufficient for any mutation', () => {
    for (const name of MUTATIONS) {
      expectHandlerDenied(PayrollRunsController, name, { FINANCE_SALARY_VIEW: 'ALL' });
      expectHandlerAllowed(PayrollRunsController, name, {
        [`FINANCE_SALARY_${EXPECTATIONS[name]?.action}`]: 'ALL',
      });
    }
  });

  it('denies missing and NONE VIEW before a company payroll read', () => {
    expectHandlerDenied(PayrollRunsController, 'findAll', {});
    expectHandlerDenied(PayrollRunsController, 'findAll', { FINANCE_SALARY_VIEW: 'NONE' });
    expectHandlerAllowed(PayrollRunsController, 'findAll', { FINANCE_SALARY_VIEW: 'ALL' });
  });

  it('lets an accountant VIEW payroll and denies mutations by action', () => {
    expectHandlerAllowed(PayrollRunsController, 'findAll', { FINANCE_SALARY_VIEW: 'ALL' });
    expectHandlerDenied(PayrollRunsController, 'create', { FINANCE_SALARY_VIEW: 'ALL' });
    expectHandlerDenied(PayrollRunsController, 'updateStatus', { FINANCE_SALARY_VIEW: 'ALL' });
  });
});

describe('PayrollRunsService object scope', () => {
  const prisma = {
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
    salaryLine: { findUnique: vi.fn(), groupBy: vi.fn() },
    payrollRun: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    bonusRelease: { count: vi.fn().mockResolvedValue(0) },
  };
  const service = new PayrollRunsService(prisma as never, { create: vi.fn() } as never);

  beforeEach(() => {
    prisma.employeeDepartment.findMany.mockReset();
    prisma.salaryLine.findUnique.mockReset();
    prisma.payrollRun.create.mockReset();
  });

  it('denies OWN company payroll reads before data leaves', async () => {
    await expect(service.findAll(actor({ FINANCE_SALARY_VIEW: 'OWN' }), {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.payrollRun.findMany).not.toHaveBeenCalled();
  });

  it('denies a guessed salary line outside DEPARTMENT', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: 'colleague' }]);
    prisma.salaryLine.findUnique.mockResolvedValue({ employeeId: 'other-person' });
    await expect(
      service.getSalaryLineMonthDetail(
        {
          id: 'emp-1',
          permissions: { FINANCE_SALARY_VIEW: 'DEPARTMENT' },
          departmentIds: ['dept-1'],
        },
        'guessed-line',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets ALL pass a guessed salary-line ownership check', async () => {
    prisma.salaryLine.findUnique.mockResolvedValue({ employeeId: 'other-person' });
    await expect(
      assertSalaryLineReadable(prisma as never, actor({ FINANCE_SALARY_VIEW: 'ALL' }), 'line-1'),
    ).resolves.toBeUndefined();
  });

  it('does not create a run when ADD is missing', async () => {
    await expect(
      service.create(actor({ FINANCE_SALARY_VIEW: 'ALL' }), { payrollMonth: '2026-09' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.payrollRun.create).not.toHaveBeenCalled();
  });
});
