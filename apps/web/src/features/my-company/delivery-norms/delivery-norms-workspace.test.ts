import { describe, expect, it } from 'vitest';
import {
  countPublished,
  locationForMapKey,
  type DeliveryNormsMapKey,
} from './delivery-norms-workspace';

describe('locationForMapKey', () => {
  it('keeps enrollment on the overview map', () => {
    expect(locationForMapKey('enrollment')).toEqual({
      tab: 'overview',
      profileTab: 'core',
      unitTab: 'core',
    });
  });

  it('opens unit editors on the matching sub-tab', () => {
    const cases: Array<[DeliveryNormsMapKey, string]> = [
      ['units', 'core'],
      ['unitCore', 'core'],
      ['unitFunction', 'function'],
    ];
    for (const [key, unitTab] of cases) {
      expect(locationForMapKey(key)).toEqual({ tab: 'units', profileTab: 'core', unitTab });
    }
  });

  it('opens composition and kits inside profiles', () => {
    expect(locationForMapKey('profileCore')).toEqual({
      tab: 'profiles',
      profileTab: 'core',
      unitTab: 'core',
    });
    expect(locationForMapKey('profileCollections')).toEqual({
      tab: 'profiles',
      profileTab: 'collections',
      unitTab: 'core',
    });
  });

  it('routes sibling domains to their own tabs', () => {
    expect(locationForMapKey('rates').tab).toBe('rates');
    expect(locationForMapKey('sale').tab).toBe('sale');
  });
});

describe('countPublished', () => {
  it('counts only published rows', () => {
    expect(
      countPublished([{ status: 'PUBLISHED' }, { status: 'DRAFT' }, { status: 'PUBLISHED' }]),
    ).toBe(2);
  });
});
