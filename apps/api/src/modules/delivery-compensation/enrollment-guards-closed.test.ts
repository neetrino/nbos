import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { assertExtensionNeverClosed, assertProductNeverClosed } from './enrollment-guards';

const OPEN = { status: 'DEVELOPMENT', deliveryResolution: null, closedAt: null };
const LOCKED = { response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } };

function productDb(row: unknown) {
  return { product: { findUnique: vi.fn().mockResolvedValue(row) } };
}

function extensionDb(row: unknown) {
  return { extension: { findUnique: vi.fn().mockResolvedValue(row) } };
}

describe('assertProductNeverClosed', () => {
  it('lets an open card enrol', async () => {
    await expect(
      assertProductNeverClosed(productDb(OPEN) as never, 'prod-1'),
    ).resolves.toBeUndefined();
  });

  it('refuses a card that is closed right now', async () => {
    await expect(
      assertProductNeverClosed(
        productDb({ status: 'DONE', deliveryResolution: 'DONE', closedAt: new Date() }) as never,
        'prod-1',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('refuses the off-board card Deal Won creates already done', async () => {
    await expect(
      assertProductNeverClosed(
        productDb({ status: 'DONE', deliveryResolution: 'DONE', closedAt: null }) as never,
        'prod-outsource',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('refuses a card reopened after complete or cancel, where only closedAt survives', async () => {
    await expect(
      assertProductNeverClosed(
        productDb({
          status: 'DEVELOPMENT',
          deliveryResolution: null,
          closedAt: new Date('2026-09-01T00:00:00Z'),
        }) as never,
        'prod-reopened',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('reports a missing product instead of enrolling nothing', async () => {
    await expect(
      assertProductNeverClosed(productDb(null) as never, 'prod-404'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('assertExtensionNeverClosed', () => {
  it('lets an open extension enrol and refuses a cancelled one', async () => {
    await expect(
      assertExtensionNeverClosed(extensionDb(OPEN) as never, 'ext-1'),
    ).resolves.toBeUndefined();

    await expect(
      assertExtensionNeverClosed(
        extensionDb({
          status: 'LOST',
          deliveryResolution: 'CANCELLED',
          closedAt: new Date(),
        }) as never,
        'ext-2',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('reports a missing extension', async () => {
    await expect(
      assertExtensionNeverClosed(extensionDb(null) as never, 'ext-404'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
