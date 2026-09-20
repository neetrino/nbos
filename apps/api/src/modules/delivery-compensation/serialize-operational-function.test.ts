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
      tiers: [],
      attachments: [{ id: 'att-1', fileAssetId: 'file-1', caption: 'Layout', sortOrder: 0 }],
    });
    expect(JSON.stringify(dto)).not.toMatch(/units|rate|amount|snapshot/i);
  });
});

describe('serializeOperationalFunction gradations', () => {
  it('lists the volumes a card is sold at, ordered, with labels only', () => {
    const dto = serializeOperationalFunction({
      id: 'fn-lang',
      code: 'CNT_MULTILINGUAL',
      category: 'content',
      iconKey: 'Languages',
      status: 'ACTIVE',
      contentVersions: [],
      tiers: [
        { id: 'tier-system', code: 'T3_SYSTEM', label: 'CRM, ERP, платформа', position: 3 },
        { id: 'tier-site', code: 'T1_SITE', label: 'Лендинг и сайт компании', position: 1 },
      ],
    });

    expect(dto.tiers).toEqual([
      { id: 'tier-site', code: 'T1_SITE', label: 'Лендинг и сайт компании', position: 1 },
      { id: 'tier-system', code: 'T3_SYSTEM', label: 'CRM, ERP, платформа', position: 3 },
    ]);
  });

  it('never carries units on a volume', () => {
    const dto = serializeOperationalFunction({
      id: 'fn-lang',
      code: 'CNT_MULTILINGUAL',
      category: 'content',
      iconKey: 'Languages',
      status: 'ACTIVE',
      contentVersions: [],
      tiers: [{ id: 'tier-site', code: 'T1_SITE', label: 'Site', position: 1 }],
    });

    expect(Object.keys(dto.tiers[0] ?? {})).toEqual(['id', 'code', 'label', 'position']);
  });
});
