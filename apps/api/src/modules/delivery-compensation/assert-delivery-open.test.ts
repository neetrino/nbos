import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  assertDeliveryOpenForConfiguration,
  assertDeliveryOpenForExtension,
} from './assert-delivery-open';

function configurationDb(row: unknown) {
  return { deliveryConfiguration: { findUnique: vi.fn().mockResolvedValue(row) } };
}

describe('assertDeliveryOpenForConfiguration', () => {
  it('allows an open product and an open extension', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({ product: { status: 'DEVELOPMENT' }, extension: null }) as never,
        'cfg-1',
      ),
    ).resolves.toBeUndefined();

    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({ product: null, extension: { status: 'QA' } }) as never,
        'cfg-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('locks a delivered product and a cancelled extension', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({ product: { status: 'DONE' }, extension: null }) as never,
        'cfg-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } });

    await expect(
      assertDeliveryOpenForConfiguration(
        configurationDb({ product: null, extension: { status: 'LOST' } }) as never,
        'cfg-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } });
  });

  it('throws when the configuration does not exist', async () => {
    await expect(
      assertDeliveryOpenForConfiguration(configurationDb(null) as never, 'cfg-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('assertDeliveryOpenForExtension', () => {
  it('locks a closed extension and allows an open one', async () => {
    const closed = { extension: { findUnique: vi.fn().mockResolvedValue({ status: 'DONE' }) } };
    const open = { extension: { findUnique: vi.fn().mockResolvedValue({ status: 'NEW' }) } };

    await expect(assertDeliveryOpenForExtension(closed as never, 'ext-1')).rejects.toMatchObject({
      response: { code: 'FINANCIAL_ALLOCATION_LOCKED' },
    });
    await expect(assertDeliveryOpenForExtension(open as never, 'ext-1')).resolves.toBeUndefined();
  });
});
