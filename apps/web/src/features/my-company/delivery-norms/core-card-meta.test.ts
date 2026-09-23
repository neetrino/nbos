import { describe, expect, it } from 'vitest';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { coreCardIncludedCount, coreCardSaleAmount } from './core-card-meta';
import type { CoreUnitSlot } from './core-unit-slots';

function profile(
  overrides: Partial<DeliveryBaseProfileFinancialDto> = {},
): DeliveryBaseProfileFinancialDto {
  return {
    id: 'core-1',
    profileKey: 'shop',
    version: 1,
    productType: 'ECOMMERCE',
    status: 'PUBLISHED',
    roleUnits: [],
    includedFunctionIds: ['fn-1', 'fn-2'],
    coreItems: [],
    ...overrides,
  };
}

function slot(rows: DeliveryBaseProfileFinancialDto[]): CoreUnitSlot {
  return { productType: 'ECOMMERCE', rows };
}

describe('coreCardMeta', () => {
  it('counts included-in-base functions on the live core', () => {
    expect(coreCardIncludedCount(slot([profile()]))).toBe(2);
    expect(coreCardIncludedCount(slot([]))).toBe(0);
  });

  it('reads the CORE sale amount for the live version', () => {
    expect(
      coreCardSaleAmount(slot([profile()]), [
        {
          id: 'sale-1',
          targetKey: 'CORE:core-1',
          version: 1,
          status: 'PUBLISHED',
          effectiveFrom: '2026-01-01',
          amountPerUnit: '250000',
          resolvedAmount: '250000',
          currency: 'AMD',
        },
      ]),
    ).toBe('250000');
  });
});
