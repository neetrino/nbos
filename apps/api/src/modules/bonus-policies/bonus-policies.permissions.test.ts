import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { RequiredPermission } from '../../common/decorators/require-permission.decorator';
import {
  expectHandlerAllowed,
  expectHandlerDenied,
  handlerNames,
  permissionOf,
} from '../finance/finance-permission-test-support';
import { FINANCE_BONUSES_MODULE } from '../compensation-profiles/finance-pay-access';
import { BonusPoliciesController } from './bonus-policies.controller';
import { BonusPoliciesService } from './bonus-policies.service';

const EXPECTATIONS: Record<string, RequiredPermission> = {
  list: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  findById: { module: FINANCE_BONUSES_MODULE, action: 'VIEW' },
  create: { module: FINANCE_BONUSES_MODULE, action: 'ADD' },
  update: { module: FINANCE_BONUSES_MODULE, action: 'EDIT' },
};

describe('Bonus policies permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (BonusPoliciesController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(BonusPoliciesController).filter(
      (name) => !permissionOf((BonusPoliciesController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('lets an accountant read bonus policies and denies writes by action', () => {
    expectHandlerAllowed(BonusPoliciesController, 'list', { FINANCE_BONUSES_VIEW: 'ALL' });
    expectHandlerDenied(BonusPoliciesController, 'create', { FINANCE_BONUSES_VIEW: 'ALL' });
    expectHandlerDenied(BonusPoliciesController, 'update', { FINANCE_BONUSES_VIEW: 'ALL' });
  });
});

describe('BonusPoliciesService read scope', () => {
  it.each(['OWN', 'DEPARTMENT'] as const)(
    'does not list company bonus policies when VIEW is %s',
    async (scope) => {
      const prisma = { bonusPolicy: { findMany: vi.fn() } };
      const service = new BonusPoliciesService(prisma as never);
      await expect(
        service.list({
          id: 'emp-1',
          permissions: { FINANCE_BONUSES_VIEW: scope },
          departmentIds: ['d1'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.bonusPolicy.findMany).not.toHaveBeenCalled();
    },
  );

  it.each(['OWN', 'DEPARTMENT'] as const)(
    'does not load a bonus policy by id when VIEW is %s',
    async (scope) => {
      const prisma = { bonusPolicy: { findUnique: vi.fn() } };
      const service = new BonusPoliciesService(prisma as never);
      await expect(
        service.findById(
          {
            id: 'emp-1',
            permissions: { FINANCE_BONUSES_VIEW: scope },
            departmentIds: ['d1'],
          },
          'bp-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.bonusPolicy.findUnique).not.toHaveBeenCalled();
    },
  );
});

describe('BonusPoliciesService write scope', () => {
  it('does not create when ADD is not ALL', async () => {
    const prisma = { bonusPolicy: { create: vi.fn() } };
    const service = new BonusPoliciesService(prisma as never);
    await expect(
      service.create(
        {
          id: 'emp-1',
          permissions: { FINANCE_BONUSES_VIEW: 'OWN', FINANCE_BONUSES_ADD: 'NONE' },
          departmentIds: [],
        },
        { name: 'Bundle', templateCode: 'SALES_COMPANY_RATES' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.bonusPolicy.create).not.toHaveBeenCalled();
  });
});
