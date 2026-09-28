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
import { FINANCE_BONUSES_MODULE } from '../compensation-profiles/finance-pay-access';
import { BonusController } from './bonus.controller';
import { BonusService } from './bonus.service';
import { SalesBonusPolicyService } from './sales-bonus-policy.service';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';

const EXPECTATIONS: Record<string, RequiredPermission> = {
  listSalesBonusPolicies: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  patchSalesBonusPolicy: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  findAll: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  getStats: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  getProductPools: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  getProductPoolLines: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  getProductPoolTimeline: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  getProductPoolLinesBatch: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  postProductPoolAutoRelease: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  postProductPoolSync: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  listBonusReleases: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  createBonusRelease: { module: FINANCE_BONUSES_MODULE, action: 'ADD' },
  patchBonusRelease: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  patchEntryPlannedAmount: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  patchEntryPayableAdjustment: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
  findOne: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  create: { module: FINANCE_BONUSES_MODULE, action: 'ADD' },
  updateStatus: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
};

const MUTATIONS = Object.entries(EXPECTATIONS)
  .filter(([, requirement]) => requirement.action !== 'VIEW')
  .map(([name]) => name);

function actor(permissions: Record<string, string>): FinancePayActor {
  return { id: 'emp-1', permissions, departmentIds: [] };
}

describe('Bonus permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (BonusController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(BonusController).filter(
      (name) => !permissionOf((BonusController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('does not treat VIEW as sufficient for any mutation', () => {
    for (const name of MUTATIONS) {
      expectHandlerDenied(BonusController, name, { FINANCE_BONUSES_VIEW: 'ALL' });
      expectHandlerAllowed(BonusController, name, {
        [`FINANCE_BONUSES_${EXPECTATIONS[name]?.action}`]: 'ALL',
      });
    }
  });

  it('lets an accountant read bonuses and denies mutations by action', () => {
    expectHandlerAllowed(BonusController, 'findAll', { FINANCE_BONUSES_VIEW: 'ALL' });
    expectHandlerDenied(BonusController, 'create', { FINANCE_BONUSES_VIEW: 'ALL' });
    expectHandlerDenied(BonusController, 'createBonusRelease', { FINANCE_BONUSES_VIEW: 'ALL' });
  });
});

describe('BonusService object scope', () => {
  const prisma = {
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
    bonusEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
  };
  const service = new BonusService(
    prisma as never,
    { create: vi.fn() } as never,
    { log: vi.fn() } as never,
  );

  beforeEach(() => {
    prisma.bonusEntry.findUnique.mockReset();
    prisma.bonusEntry.create.mockReset();
  });

  it('denies OWN reading another employee bonus by guessed id', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue({
      id: 'guessed',
      employeeId: 'other-person',
    });
    await expect(
      service.findById(actor({ FINANCE_BONUSES_VIEW: 'OWN' }), 'guessed'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets ALL read another employee bonus', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      employeeId: 'other-person',
      employee: {},
      order: {},
      project: {},
    });
    await expect(service.findById(actor({ FINANCE_BONUSES_VIEW: 'ALL' }), 'be1')).resolves.toEqual(
      expect.objectContaining({ id: 'be1' }),
    );
  });

  it('does not create when ADD is missing', async () => {
    await expect(
      service.create(actor({ FINANCE_BONUSES_VIEW: 'ALL', FINANCE_BONUSES_EDIT: 'OWN' }), {
        employeeId: 'emp-1',
        orderId: 'o1',
        projectId: 'p1',
        type: 'SALES',
        amount: 10,
        percent: 5,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.bonusEntry.create).not.toHaveBeenCalled();
  });
});

describe('Sales bonus policy company-wide access', () => {
  const prisma = { salesBonusPolicy: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() } };
  const service = new SalesBonusPolicyService(prisma as never);

  it('denies OWN from reading the company rate table', async () => {
    await expect(service.listAll(actor({ FINANCE_BONUSES_VIEW: 'OWN' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.salesBonusPolicy.findMany).not.toHaveBeenCalled();
  });
});
