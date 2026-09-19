import { describe, expect, it, vi } from 'vitest';
import { FunctionCatalogService } from './function-catalog.service';

const DRAFT_ROW = {
  id: 'fn-1',
  code: 'warehouse',
  category: 'ops',
  iconKey: 'Warehouse',
  status: 'DRAFT',
  contentVersions: [
    {
      id: 'cv-1',
      version: 1,
      title: 'Warehouse',
      summary: 'Stock',
      scopeBoundaries: 'One',
      instructions: 'Receive',
      acceptanceCriteria: 'SKU',
      publishedAt: null,
      attachments: [],
    },
  ],
};

describe('FunctionCatalogService archive', () => {
  it('archives a referenced function so historical configurations keep the archive', async () => {
    const update = vi.fn().mockResolvedValue({ ...DRAFT_ROW, status: 'ARCHIVED' });
    const service = new FunctionCatalogService({
      deliveryFunction: {
        findUnique: vi.fn().mockResolvedValue({ ...DRAFT_ROW, status: 'ACTIVE' }),
        update,
      },
    } as never);

    await expect(service.archive('fn-1')).resolves.toMatchObject({ status: 'ARCHIVED' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ARCHIVED' }) }),
    );
  });
});

describe('FunctionCatalogService replaceContent', () => {
  it('creates a new content version and does not write price versions', async () => {
    const update = vi.fn().mockResolvedValue({
      ...DRAFT_ROW,
      contentVersions: [
        { ...DRAFT_ROW.contentVersions[0], version: 2, title: 'Warehouse v2' },
        DRAFT_ROW.contentVersions[0],
      ],
    });
    const service = new FunctionCatalogService({
      deliveryFunction: {
        findUnique: vi.fn().mockResolvedValue(DRAFT_ROW),
        update,
      },
    } as never);

    await service.replaceContent(
      'fn-1',
      {
        title: 'Warehouse v2',
        summary: 'Stock',
        scopeBoundaries: 'One',
        instructions: 'Receive',
        acceptanceCriteria: 'SKU',
      },
      'emp-1',
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentVersions: expect.objectContaining({
            create: expect.objectContaining({ version: 2, title: 'Warehouse v2' }),
          }),
        }),
      }),
    );
    expect(update.mock.calls[0]?.[0]?.data).not.toHaveProperty('priceVersions');
  });
});
