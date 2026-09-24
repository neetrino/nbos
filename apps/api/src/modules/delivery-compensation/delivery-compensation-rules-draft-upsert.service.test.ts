import { describe, expect, it, vi } from 'vitest';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseFunctionPriceWriteBody,
  parseRoleRateWriteBody,
} from '@nbos/shared';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';

const FUNCTION_ID = '11111111-2222-3333-4444-555555555555';

function rulesClient(partial: Record<string, unknown>) {
  const prisma = { ...partial };
  return {
    ...prisma,
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };
}

function vector(units: string | null = '10') {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'REQUIRED',
    units,
  }));
}

describe('open draft upsert', () => {
  it('updates an open function-price draft instead of creating another version', async () => {
    const update = vi.fn().mockResolvedValue({
      id: 'price-1',
      functionId: FUNCTION_ID,
      tierId: null,
      version: 1,
      status: 'DRAFT',
      roleUnits: vector('12'),
    });
    const deleteMany = vi.fn();
    const create = vi.fn();
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: {
          findUnique: vi.fn().mockResolvedValue({ id: FUNCTION_ID, tiers: [] }),
        },
        deliveryFunctionPriceVersion: {
          findFirst: vi.fn().mockResolvedValue({ id: 'price-1' }),
          create,
          update,
        },
        deliveryFunctionPriceRoleUnit: { deleteMany },
      }) as never,
    );

    await service.createFunctionPriceDraft(
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: vector('12'),
      }),
    );

    expect(create).not.toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it('updates an open role-rate draft instead of creating another version', async () => {
    const update = vi.fn().mockResolvedValue({
      id: 'rate-1',
      roleKey: 'BACKEND',
      currency: 'AMD',
      rate: { toString: () => '1500.0000' },
      version: 1,
      status: 'DRAFT',
    });
    const create = vi.fn();
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryRoleRateVersion: {
          findFirst: vi.fn().mockResolvedValue({ id: 'rate-1' }),
          create,
          update,
        },
      }) as never,
    );

    await service.createRoleRateDraft(
      parseRoleRateWriteBody({
        roleKey: 'BACKEND',
        rate: '1500',
        effectiveFrom: '2026-10-01T00:00:00.000Z',
      }),
    );

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rate-1' },
        data: { rate: '1500' },
      }),
    );
  });
});
