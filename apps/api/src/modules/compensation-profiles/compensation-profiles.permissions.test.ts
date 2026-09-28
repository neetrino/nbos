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
import { FINANCE_SALARY_MODULE, type FinancePayActor } from './finance-pay-access';
import { CompensationProfilesController } from './compensation-profiles.controller';
import { CompensationProfilesService } from './compensation-profiles.service';

const EXPECTATIONS: Record<string, RequiredPermission> = {
  listForEmployee: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  createDraft: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  patchDraft: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  activate: { module: FINANCE_SALARY_MODULE, action: 'EDIT' },
  listActive: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
  findById: { module: FINANCE_SALARY_MODULE, action: 'VIEW' },
};

function actor(permissions: Record<string, string>, id = 'emp-1'): FinancePayActor {
  return { id, permissions, departmentIds: [] };
}

describe('Compensation profiles permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (CompensationProfilesController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(CompensationProfilesController).filter(
      (name) =>
        !permissionOf((CompensationProfilesController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('lets an accountant read profiles and denies activate by action', () => {
    expectHandlerAllowed(CompensationProfilesController, 'listForEmployee', {
      FINANCE_SALARY_VIEW: 'ALL',
    });
    expectHandlerDenied(CompensationProfilesController, 'activate', { FINANCE_SALARY_VIEW: 'ALL' });
    expectHandlerDenied(CompensationProfilesController, 'createDraft', {
      FINANCE_SALARY_VIEW: 'ALL',
    });
  });
});

describe('CompensationProfilesService object scope', () => {
  const prisma = {
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
    employee: { findUnique: vi.fn().mockResolvedValue({ id: 'other-person' }) },
    compensationProfile: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  };
  const service = new CompensationProfilesService(prisma as never);

  beforeEach(() => {
    prisma.compensationProfile.findMany.mockReset();
    prisma.compensationProfile.create.mockReset();
  });

  it('denies OWN reading another employee profile list', async () => {
    await expect(
      service.listForEmployee(actor({ FINANCE_SALARY_VIEW: 'OWN' }), 'other-person'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.compensationProfile.findMany).not.toHaveBeenCalled();
  });

  it('does not create a draft without EDIT', async () => {
    await expect(
      service.createDraft(actor({ FINANCE_SALARY_VIEW: 'ALL' }), 'other-person', {
        baseSalary: 1,
        effectiveFrom: '2026-09-01',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.compensationProfile.create).not.toHaveBeenCalled();
  });
});
