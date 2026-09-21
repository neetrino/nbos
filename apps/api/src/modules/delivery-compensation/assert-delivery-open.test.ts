import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  assertDeliveryOpenForConfiguration,
  assertDeliveryOpenForExtension,
} from './assert-delivery-open';

function configurationDb(row: unknown) {
  return { deliveryConfiguration: { findUnique: vi.fn().mockResolvedValue(row) } };
}

function extensionDb(configuration: unknown, extension: unknown = null) {
  return {
    deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(configuration) },
    extension: { findUnique: vi.fn().mockResolvedValue(extension) },
  };
}

const LOCKED = { response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } };

describe('assertDeliveryOpenForConfiguration', () => {
  it('allows an open product and an open extension', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: null,
          product: { status: 'DEVELOPMENT' },
          extension: null,
        }) as never,
        'cfg-1',
      ),
    ).resolves.toBeUndefined();

    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: null,
          product: null,
          extension: { status: 'QA' },
        }) as never,
        'cfg-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('locks a delivered product and a cancelled extension', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: new Date('2026-09-21T00:00:00Z'),
          product: { status: 'DONE' },
          extension: null,
        }) as never,
        'cfg-1',
      ),
    ).rejects.toMatchObject(LOCKED);

    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: new Date('2026-09-21T00:00:00Z'),
          product: null,
          extension: { status: 'LOST' },
        }) as never,
        'cfg-1',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('keeps a reopened card locked, because the stamp outlives the status', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: new Date('2026-09-21T00:00:00Z'),
          product: { status: 'DEVELOPMENT' },
          extension: null,
        }) as never,
        'cfg-reopened',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('locks a card closed before the stamp existed', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({
          scopeLockedAt: null,
          product: { status: 'DONE' },
          extension: null,
        }) as never,
        'cfg-legacy-close',
      ),
    ).rejects.toMatchObject(LOCKED);
  });

  it('throws when the configuration does not exist', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(configurationDb(null) as never, 'cfg-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('assertDeliveryOpenForExtension', () => {
  it('locks a closed extension and allows an open one', async () => {
    const closed = extensionDb({
      scopeLockedAt: new Date('2026-09-21T00:00:00Z'),
      extension: { status: 'DONE' },
    });
    const open = extensionDb({ scopeLockedAt: null, extension: { status: 'NEW' } });

    await expect(assertDeliveryOpenForExtension(closed as never, 'ext-1')).rejects.toMatchObject(
      LOCKED,
    );
    await expect(assertDeliveryOpenForExtension(open as never, 'ext-1')).resolves.toBeUndefined();
  });

  it('keeps a reopened extension locked', async () => {
    const reopened = extensionDb({
      scopeLockedAt: new Date('2026-09-21T00:00:00Z'),
      extension: { status: 'DEVELOPMENT' },
    });

    await expect(assertDeliveryOpenForExtension(reopened as never, 'ext-1')).rejects.toMatchObject(
      LOCKED,
    );
  });

  it('falls back to the extension status when the card is not enrolled', async () => {
    const notEnrolled = extensionDb(null, { status: 'NEW' });
    const closedNotEnrolled = extensionDb(null, { status: 'LOST' });

    await expect(
      assertDeliveryOpenForExtension(notEnrolled as never, 'ext-1'),
    ).resolves.toBeUndefined();
    await expect(
      assertDeliveryOpenForExtension(closedNotEnrolled as never, 'ext-2'),
    ).rejects.toMatchObject(LOCKED);
  });

  it('throws when neither a configuration nor the extension exists', async () => {
    await expect(
      assertDeliveryOpenForExtension(extensionDb(null, null) as never, 'ext-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
