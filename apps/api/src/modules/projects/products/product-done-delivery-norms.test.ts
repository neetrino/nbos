import { describe, expect, it, vi } from 'vitest';
import { loadUnpricedDeliveryNormativeLabels } from './product-done-delivery-norms';

function buildPrisma(configuration: unknown, pricedCodes: string[] = []) {
  return {
    deliveryConfiguration: { findUnique: vi.fn().mockResolvedValue(configuration) },
    deliveryFunction: {
      findMany: vi.fn().mockResolvedValue(pricedCodes.map((code) => ({ code }))),
    },
  };
}

describe('loadUnpricedDeliveryNormativeLabels', () => {
  it('returns nothing for a legacy card', async () => {
    const prisma = buildPrisma(null);
    await expect(loadUnpricedDeliveryNormativeLabels(prisma as never, 'p-1')).resolves.toEqual([]);
  });

  it('blocks a draft plan whose base profile is not published', async () => {
    const prisma = buildPrisma({
      mode: 'V2',
      initialRevisionId: null,
      baseProfileVersion: { status: 'DRAFT' },
      features: [],
    });

    await expect(loadUnpricedDeliveryNormativeLabels(prisma as never, 'p-1')).resolves.toEqual([
      'product base profile',
    ]);
  });

  it('names an extra function that has no published units', async () => {
    const prisma = buildPrisma(
      {
        mode: 'V2',
        initialRevisionId: null,
        baseProfileVersion: { status: 'PUBLISHED' },
        features: [{ function: { code: 'BANK_PAYMENT' } }, { function: { code: 'BOOKING_FLOW' } }],
      },
      ['BANK_PAYMENT'],
    );

    await expect(loadUnpricedDeliveryNormativeLabels(prisma as never, 'p-1')).resolves.toEqual([
      'BOOKING_FLOW',
    ]);
  });

  it('asks only for extra features, since included ones carry no own units', async () => {
    const prisma = buildPrisma({
      mode: 'V2',
      initialRevisionId: null,
      baseProfileVersion: { status: 'PUBLISHED' },
      features: [],
    });

    await loadUnpricedDeliveryNormativeLabels(prisma as never, 'p-1');

    expect(
      prisma.deliveryConfiguration.findUnique.mock.calls[0]?.[0].select.features.where,
    ).toEqual({ archivedAt: null, origin: 'EXTRA' });
  });

  it('lets a materialized plan close even after a newer norm version was published', async () => {
    const prisma = buildPrisma({
      mode: 'V2',
      initialRevisionId: 'rev-1',
      baseProfileVersion: { status: 'ARCHIVED' },
      features: [{ function: { code: 'BOOKING_FLOW' } }],
    });

    await expect(loadUnpricedDeliveryNormativeLabels(prisma as never, 'p-1')).resolves.toEqual([]);
    expect(prisma.deliveryFunction.findMany).not.toHaveBeenCalled();
  });
});
