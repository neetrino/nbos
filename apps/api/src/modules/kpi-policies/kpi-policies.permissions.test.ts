import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import type { RequiredPermission } from '../../common/decorators/require-permission.decorator';
import {
  expectHandlerAllowed,
  expectHandlerDenied,
  handlerNames,
  permissionOf,
} from '../finance/finance-permission-test-support';
import { FINANCE_SALARY_MODULE } from '../compensation-profiles/finance-pay-access';
import { KpiPoliciesController } from './kpi-policies.controller';
import { KpiPoliciesService } from './kpi-policies.service';
import { ForbiddenException } from '@nestjs/common';

const EXPECTATIONS: Record<string, RequiredPermission> = {
  list: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  findById: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  create: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  update: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
};

describe('KPI policies permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (KpiPoliciesController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(KpiPoliciesController).filter(
      (name) => !permissionOf((KpiPoliciesController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('lets an accountant read KPI policies and denies writes by action', () => {
    expectHandlerAllowed(KpiPoliciesController, 'list', { FINANCE_SALARY_VIEW: 'ALL' });
    expectHandlerDenied(KpiPoliciesController, 'create', { FINANCE_SALARY_VIEW: 'ALL' });
    expectHandlerDenied(KpiPoliciesController, 'update', { FINANCE_SALARY_VIEW: 'ALL' });
  });
});

describe('KpiPoliciesService read scope', () => {
  it.each(['OWN', 'DEPARTMENT'] as const)(
    'does not list company KPI policies when VIEW is %s',
    async (scope) => {
      const prisma = { kpiPolicy: { findMany: vi.fn() } };
      const service = new KpiPoliciesService(prisma as never);
      await expect(
        service.list({
          id: 'emp-1',
          permissions: { FINANCE_SALARY_VIEW: scope },
          departmentIds: ['d1'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.kpiPolicy.findMany).not.toHaveBeenCalled();
    },
  );

  it.each(['OWN', 'DEPARTMENT'] as const)(
    'does not load a KPI policy by id when VIEW is %s',
    async (scope) => {
      const prisma = { kpiPolicy: { findUnique: vi.fn() } };
      const service = new KpiPoliciesService(prisma as never);
      await expect(
        service.findById(
          {
            id: 'emp-1',
            permissions: { FINANCE_SALARY_VIEW: scope },
            departmentIds: ['d1'],
          },
          'kpi-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.kpiPolicy.findUnique).not.toHaveBeenCalled();
    },
  );
});

describe('KpiPoliciesService write scope', () => {
  it('does not create when EDIT is not ALL', async () => {
    const prisma = { kpiPolicy: { create: vi.fn() } };
    const service = new KpiPoliciesService(prisma as never);
    await expect(
      service.create(
        {
          id: 'emp-1',
          permissions: { FINANCE_SALARY_VIEW: 'ALL', FINANCE_SALARY_EDIT: 'OWN' },
          departmentIds: [],
        },
        { name: 'Gate', gateRules: { bands: [] } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.kpiPolicy.create).not.toHaveBeenCalled();
  });
});
