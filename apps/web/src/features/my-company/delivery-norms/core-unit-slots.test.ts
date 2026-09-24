import { describe, expect, it } from 'vitest';
import type { DeliveryBaseProfileFinancialDto } from '@nbos/shared';
import { coreUnitSlots } from './core-unit-slots';

function row(
  id: string,
  productType: string | null,
  status: string,
  version: number,
): DeliveryBaseProfileFinancialDto {
  return {
    id,
    profileKey: 'shop',
    version,
    productType,
    status,
    roleUnits: [],
    includedFunctionIds: [],
    coreItems: [],
  };
}

describe('coreUnitSlots', () => {
  it('shows an empty card for a kind that has no live norm', () => {
    const slots = coreUnitSlots(
      ['ECOMMERCE', 'LOGO'],
      [row('published', 'ECOMMERCE', 'PUBLISHED', 1), row('archived', 'LOGO', 'ARCHIVED', 2)],
    );
    expect(slots[0]?.rows.map((item) => item.id)).toEqual(['published']);
    expect(slots[1]?.rows).toEqual([]);
  });

  it('keeps the newest live version first', () => {
    const slots = coreUnitSlots(
      ['ECOMMERCE'],
      [row('old', 'ECOMMERCE', 'ARCHIVED', 1), row('draft', 'ECOMMERCE', 'DRAFT', 3)],
    );
    expect(slots[0]?.rows.map((item) => item.id)).toEqual(['draft']);
  });
});
