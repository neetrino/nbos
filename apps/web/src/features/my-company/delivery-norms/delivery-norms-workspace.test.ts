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
      profileTab: 'versions',
    });
  });

  it('opens nested profile editors on the matching sub-tab', () => {
    const cases: Array<[DeliveryNormsMapKey, string]> = [
      ['profiles', 'versions'],
      ['profileUnits', 'versions'],
      ['profileIncluded', 'versions'],
      ['profileCore', 'core'],
      ['profilePresets', 'presets'],
    ];
    for (const [key, profileTab] of cases) {
      expect(locationForMapKey(key)).toEqual({ tab: 'profiles', profileTab });
    }
  });

  it('routes sibling domains to their own tabs', () => {
    expect(locationForMapKey('rates').tab).toBe('rates');
    expect(locationForMapKey('functions').tab).toBe('functions');
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
