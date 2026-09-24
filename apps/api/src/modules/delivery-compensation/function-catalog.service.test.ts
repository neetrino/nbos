import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { parseCatalogContentWriteBody } from '@nbos/shared';
import { FunctionCatalogService } from './function-catalog.service';
import { mapCatalogWriteError } from './map-catalog-write-error';

describe('FunctionCatalogService visibility', () => {
  it('lists only ACTIVE functions for readers', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const groupBy = vi.fn().mockResolvedValue([]);
    const service = new FunctionCatalogService({
      deliveryFunction: { findMany, count, groupBy },
    } as never);
    await service.listOperational(false, {});
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'ACTIVE' } }));
  });

  it('lists cards without instruction or attachment blobs', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'fn-1',
        code: 'bank',
        category: 'commerce',
        iconKey: 'Card',
        status: 'ACTIVE',
        contentVersions: [
          { version: 1, title: 'Bank', summary: 'Pay', publishedAt: new Date('2026-01-01') },
        ],
        tiers: [],
      },
    ]);
    const service = new FunctionCatalogService({
      deliveryFunction: {
        findMany,
        count: vi.fn().mockResolvedValue(1),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    } as never);
    const listed = await service.listOperational(false, {});
    expect(listed.items[0]?.title).toBe('Bank');
    expect(listed.items[0]?.instructions).toBe('');
    expect(listed.items[0]?.attachments).toEqual([]);
    expect(
      findMany.mock.calls[0]?.[0]?.include?.contentVersions?.select?.instructions,
    ).toBeUndefined();
    expect(findMany.mock.calls[0]?.[0]?.include?.contentVersions?.select?.title).toBe(true);
  });
});

describe('FunctionCatalogService createDraft', () => {
  it('persists content only after rejecting financial mass-assignment', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'fn-1',
      code: 'bank-payment',
      category: 'commerce',
      iconKey: 'CreditCard',
      status: 'DRAFT',
      contentVersions: [
        {
          version: 1,
          title: 'Bank payment',
          summary: 'Pay',
          scopeBoundaries: 'Web',
          instructions: 'Wire',
          acceptanceCriteria: 'Paid',
          publishedAt: null,
          attachments: [],
        },
      ],
    });
    const service = new FunctionCatalogService({
      deliveryFunction: { create },
    } as never);

    const created = await service.createDraft(
      parseCatalogContentWriteBody({
        code: 'bank-payment',
        category: 'commerce',
        iconKey: 'CreditCard',
        title: 'Bank payment',
        summary: 'Pay',
        scopeBoundaries: 'Web',
        instructions: 'Wire',
        acceptanceCriteria: 'Paid',
      }),
      'emp-1',
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          units: expect.anything(),
          priceVersions: expect.anything(),
        }),
      }),
    );
    expect(JSON.stringify(created)).not.toMatch(/units|rate|amount/i);
  });

  it('maps financial keys on the write body to 400 without persisting', () => {
    expect(() => {
      try {
        parseCatalogContentWriteBody({
          code: 'bank-payment',
          category: 'commerce',
          iconKey: 'CreditCard',
          title: 'Bank payment',
          summary: 'Pay',
          scopeBoundaries: 'Web',
          instructions: 'Wire',
          acceptanceCriteria: 'Paid',
          units: '12',
        });
      } catch (error) {
        mapCatalogWriteError(error);
      }
    }).toThrow(BadRequestException);
  });
});
