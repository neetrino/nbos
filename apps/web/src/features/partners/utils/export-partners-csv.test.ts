import { describe, expect, it } from 'vitest';
import { buildPartnersCsvContent } from './export-partners-csv';
import type { Partner } from '@/lib/api/partners';

function minimalPartner(overrides: Partial<Partner>): Partner {
  return {
    id: 'p1',
    name: 'Acme',
    level: 'REGULAR',
    direction: 'OUTBOUND',
    defaultPercent: '10',
    status: 'ACTIVE',
    contactId: null,
    notes: null,
    startDate: null,
    agreementStatus: 'NO_AGREEMENT',
    agreementStartDate: null,
    agreementEndDate: null,
    agreementSpecialTerms: null,
    agreementFileAssetId: null,
    agreementFileAsset: null,
    agreementOwnerId: null,
    agreementOwner: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    updatedAt: '2026-04-28T12:00:00.000Z',
    contact: null,
    _count: { orders: 1, subscriptions: 2 },
    ...overrides,
  } as Partner;
}

describe('buildPartnersCsvContent', () => {
  it('header only when empty', () => {
    const csv = buildPartnersCsvContent([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('defaultPercent');
    expect(csv).toContain('level');
    expect(csv).toContain('updatedAt');
  });

  it('escapes name with comma', () => {
    const csv = buildPartnersCsvContent([minimalPartner({ name: 'Acme, Inc.' })]);
    expect(csv).toContain('"Acme, Inc."');
  });

  it('appends grand total with summed link counts', () => {
    const csv = buildPartnersCsvContent([
      minimalPartner({ id: 'a', _count: { orders: 2, subscriptions: 1 } }),
      minimalPartner({
        id: 'b',
        name: 'Beta',
        _count: { orders: 0, subscriptions: 3 },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All partners (2)');
    expect(lines[3]).toMatch(/,2,4,/);
  });
});
