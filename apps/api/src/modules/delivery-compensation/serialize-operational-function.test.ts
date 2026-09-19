import { describe, expect, it } from 'vitest';
import { serializeOperationalFunction } from './serialize-operational-function';

describe('serializeOperationalFunction', () => {
  it('emits content only and never copies price versions', () => {
    const dto = serializeOperationalFunction({
      id: 'fn-1',
      code: 'warehouse',
      category: 'ops',
      iconKey: 'Warehouse',
      status: 'ACTIVE',
      contentVersions: [
        {
          version: 1,
          title: 'Warehouse',
          summary: 'Stock',
          scopeBoundaries: 'One site',
          instructions: 'Receive goods',
          acceptanceCriteria: 'SKU listed',
          publishedAt: new Date('2026-01-01'),
          attachments: [{ id: 'att-1', fileAssetId: 'file-1', caption: 'Layout', sortOrder: 0 }],
        },
      ],
    });

    expect(dto).toEqual({
      id: 'fn-1',
      code: 'warehouse',
      category: 'ops',
      iconKey: 'Warehouse',
      status: 'ACTIVE',
      title: 'Warehouse',
      summary: 'Stock',
      scopeBoundaries: 'One site',
      instructions: 'Receive goods',
      acceptanceCriteria: 'SKU listed',
      contentVersion: 1,
      attachments: [{ id: 'att-1', fileAssetId: 'file-1', caption: 'Layout', sortOrder: 0 }],
    });
    expect(JSON.stringify(dto)).not.toMatch(/units|rate|amount|snapshot/i);
  });
});
