import { describe, expect, it } from 'vitest';
import type { Prisma } from '@nbos/database';
import { applyDealListResponsibilityWhere } from './deal-list-responsibility.where';

describe('applyDealListResponsibilityWhere', () => {
  it('sets sellerId and sellerAssistantId', () => {
    const where: Prisma.DealWhereInput = {};
    applyDealListResponsibilityWhere(where, {
      sellerId: 's-1',
      sellerAssistantId: 'a-1',
    });
    expect(where.sellerId).toBe('s-1');
    expect(where.sellerAssistantId).toBe('a-1');
    expect(where.AND).toBeUndefined();
  });

  it('ignores blank ids', () => {
    const where: Prisma.DealWhereInput = {};
    applyDealListResponsibilityWhere(where, {
      sellerId: '  ',
      involvedEmployeeId: '',
    });
    expect(where.sellerId).toBeUndefined();
    expect(where.AND).toBeUndefined();
  });

  it('matches involved employee as seller or assistant', () => {
    const where: Prisma.DealWhereInput = { status: 'NEGOTIATION' };
    applyDealListResponsibilityWhere(where, { involvedEmployeeId: 'emp-1' });
    expect(where.AND).toEqual([{ OR: [{ sellerId: 'emp-1' }, { sellerAssistantId: 'emp-1' }] }]);
  });

  it('keeps search OR and involved role as AND', () => {
    const where: Prisma.DealWhereInput = {
      OR: [{ code: { contains: 'D-1' } }],
    };
    applyDealListResponsibilityWhere(where, { involvedEmployeeId: 'emp-2' });
    expect(where.OR).toEqual([{ code: { contains: 'D-1' } }]);
    expect(where.AND).toEqual([{ OR: [{ sellerId: 'emp-2' }, { sellerAssistantId: 'emp-2' }] }]);
  });
});
