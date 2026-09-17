import { describe, expect, it } from 'vitest';
import {
  permanentPurgeableTrashedCompanyWhere,
  purgeableTrashedCompanyWhere,
} from './profile-a-purgeable-where';

describe('company purge relation guards', () => {
  it('blocks permanent delete while billed products remain', () => {
    expect(permanentPurgeableTrashedCompanyWhere('co-1')).toEqual(
      expect.objectContaining({
        id: 'co-1',
        products: { none: {} },
      }),
    );
  });

  it('blocks retention purge while billed products remain', () => {
    const now = new Date('2026-09-17T12:00:00.000Z');
    expect(purgeableTrashedCompanyWhere(now, 30 * 24 * 60 * 60 * 1000)).toEqual(
      expect.objectContaining({
        products: { none: {} },
      }),
    );
  });
});
