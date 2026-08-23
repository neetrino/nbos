import { describe, expect, it } from 'vitest';
import { ENTITY_CODE_PREFIX } from './entity-code-series';
import { ENTITY_CODE_SEED_SERIES, seedCountersFromCodes } from './entity-code-seed';

describe('entity code seed', () => {
  it('covers every independent production series including Tasks', () => {
    expect(ENTITY_CODE_SEED_SERIES.map((series) => series.scope)).toEqual([
      'TASK',
      'INVOICE',
      'SUPPORT_TICKET',
      'DEAL',
      'LEAD',
      'ORDER',
      'SUBSCRIPTION',
      'PROJECT',
    ]);
  });

  it('seeds the numeric maximum and ignores malformed rows', () => {
    const seeded = seedCountersFromCodes(
      [
        'INV-2025-0042',
        'INV-2026-9999',
        'INV-2026-10000',
        'INV-2026-foo',
        'INV-26-0007',
        'D-2026-0001',
        'INV-2026-0998',
      ],
      ENTITY_CODE_PREFIX.invoice,
    );

    expect(seeded).toEqual([
      { year: 2025, nextValue: 42 },
      { year: 2026, nextValue: 10000 },
    ]);
  });

  it('returns no rows when a year has only malformed codes', () => {
    expect(
      seedCountersFromCodes(['TKT-2026-draft', 'legacy-1'], ENTITY_CODE_PREFIX.supportTicket),
    ).toEqual([]);
  });
});
