import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  SYNTHETIC_TEST_BASE_UNITS,
  SYNTHETIC_TEST_RATES,
} from '../../../../../packages/shared/src/delivery-compensation/synthetic-test-fixtures';
import { materializeInitialDeliveryPlanIfNeeded } from './materialize-initial-delivery-plan';

describe('materializeInitialDeliveryPlanIfNeeded', () => {
  it('skips when no V2 configuration exists (L01 / legacy)', async () => {
    const db = {
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null) },
      bonusEntry: { create: vi.fn() },
    };
    await expect(
      materializeInitialDeliveryPlanIfNeeded(db as never, {
        entityKind: 'PRODUCT',
        productId: 'product-1',
        actorEmployeeId: 'actor-1',
      }),
    ).resolves.toEqual({ status: 'SKIPPED_LEGACY' });
    expect(db.bonusEntry.create).not.toHaveBeenCalled();
  });

  it('returns already materialized without writing a second plan (L03 / L05)', async () => {
    const config = {
      id: 'cfg-1',
      mode: 'V2',
      orderId: 'order-1',
      initialRevisionId: 'rev-1',
      order: { id: 'order-1', projectId: 'proj-1' },
      features: [],
      baseProfileVersion: { roleUnits: SYNTHETIC_TEST_BASE_UNITS },
    };
    const db = {
      deliveryConfiguration: {
        findFirst: vi.fn().mockResolvedValue(config),
        findUnique: vi.fn().mockResolvedValue(config),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      bonusEntry: { create: vi.fn() },
    };
    await expect(
      materializeInitialDeliveryPlanIfNeeded(db as never, {
        entityKind: 'PRODUCT',
        productId: 'product-1',
        actorEmployeeId: 'actor-1',
      }),
    ).resolves.toEqual({ status: 'ALREADY_MATERIALIZED', orderId: 'order-1' });
    expect(db.bonusEntry.create).not.toHaveBeenCalled();
  });

  it('blocks incomplete V2 setup with a safe code and writes nothing (L06)', async () => {
    const config = {
      id: 'cfg-1',
      mode: 'V2',
      orderId: 'order-1',
      initialRevisionId: null,
      checkedAt: null,
      checkedById: null,
      designMode: 'FULL_DESIGN',
      aiDesignerReview: false,
      order: { id: 'order-1', projectId: 'proj-1' },
      features: [],
      baseProfileVersion: { roleUnits: SYNTHETIC_TEST_BASE_UNITS },
    };
    const db = {
      deliveryConfiguration: {
        findFirst: vi.fn().mockResolvedValue(config),
        findUnique: vi.fn().mockResolvedValue(config),
        update: vi.fn(),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          developerId: 'emp-be',
          frontendDeveloperId: 'emp-fe',
          pmId: 'emp-pm',
          designerId: 'emp-de',
          qaLeadId: 'emp-qa',
          technicalSpecialistId: 'emp-ts',
        }),
      },
      deliveryRoleRateVersion: { findMany: vi.fn().mockResolvedValue([]) },
      deliveryFunctionPriceVersion: { findMany: vi.fn().mockResolvedValue([]) },
      deliveryConfigurationRevision: { create: vi.fn() },
      bonusEntry: { create: vi.fn() },
    };

    await expect(
      materializeInitialDeliveryPlanIfNeeded(db as never, {
        entityKind: 'PRODUCT',
        productId: 'product-1',
        actorEmployeeId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.deliveryConfigurationRevision.create).not.toHaveBeenCalled();
    expect(db.bonusEntry.create).not.toHaveBeenCalled();
  });

  it('creates one revision and one BonusEntry per positive role line (L02)', async () => {
    const config = {
      id: 'cfg-1',
      mode: 'V2',
      orderId: 'order-1',
      initialRevisionId: null,
      checkedAt: new Date('2026-09-19T00:00:00.000Z'),
      checkedById: 'actor-1',
      designMode: 'FULL_DESIGN',
      aiDesignerReview: false,
      order: { id: 'order-1', projectId: 'proj-1' },
      features: [],
      baseProfileVersion: { roleUnits: SYNTHETIC_TEST_BASE_UNITS },
    };
    const db = {
      deliveryConfiguration: {
        findFirst: vi.fn().mockResolvedValue(config),
        findUnique: vi.fn().mockResolvedValue(config),
        update: vi.fn().mockResolvedValue(config),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          developerId: 'emp-be',
          frontendDeveloperId: 'emp-fe',
          pmId: 'emp-pm',
          designerId: 'emp-de',
          qaLeadId: 'emp-qa',
          technicalSpecialistId: 'emp-ts',
        }),
      },
      deliveryRoleRateVersion: {
        findMany: vi.fn().mockResolvedValue(
          SYNTHETIC_TEST_RATES.map((row) => ({
            roleKey: row.roleKey,
            rate: row.rate,
            status: 'PUBLISHED',
            effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          })),
        ),
      },
      deliveryFunctionPriceVersion: { findMany: vi.fn().mockResolvedValue([]) },
      deliveryConfigurationRevision: {
        create: vi.fn().mockResolvedValue({ id: 'rev-1' }),
      },
      deliveryBonusComponent: {
        create: vi.fn().mockImplementation(({ data }) => ({ id: `comp-${data.roleKey}`, ...data })),
      },
      deliveryBonusAllocation: {
        create: vi
          .fn()
          .mockImplementation(({ data }) => ({ id: `alloc-${data.employeeId}`, ...data })),
      },
      bonusEntry: {
        create: vi
          .fn()
          .mockImplementation(({ data }) => ({ id: `be-${data.deliveryRoleKey}`, ...data })),
      },
    };

    const result = await materializeInitialDeliveryPlanIfNeeded(db as never, {
      entityKind: 'PRODUCT',
      productId: 'product-1',
      actorEmployeeId: 'actor-1',
    });

    expect(result.status).toBe('CREATED');
    if (result.status !== 'CREATED') return;
    expect(result.bonusEntryIds).toHaveLength(6);
    expect(db.deliveryConfigurationRevision.create).toHaveBeenCalledTimes(1);
    expect(db.bonusEntry.create).toHaveBeenCalledTimes(6);
    expect(db.bonusEntry.create.mock.calls[0]?.[0].data.status).toBe('INCOMING');
    expect(db.bonusEntry.create.mock.calls[0]?.[0].data.deliverySource).toBe(
      'DELIVERY_CONFIGURATOR_V2',
    );
    expect(
      JSON.stringify(db.deliveryConfigurationRevision.create.mock.calls[0]?.[0].data.scopeSnapshot),
    ).not.toMatch(/units|rate/);
  });
});
