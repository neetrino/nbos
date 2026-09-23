import { describe, expect, it } from 'vitest';
import { parseDeliveryNormsLocation } from './delivery-norms-tab-storage';

describe('parseDeliveryNormsLocation', () => {
  it('keeps a stored profiles visit', () => {
    expect(
      parseDeliveryNormsLocation(
        JSON.stringify({ tab: 'profiles', profileTab: 'collections', unitTab: 'function' }),
      ),
    ).toEqual({ tab: 'profiles', profileTab: 'collections', unitTab: 'function' });
  });

  it('falls back to Model when the stored tab is unknown', () => {
    expect(parseDeliveryNormsLocation('{"tab":"gone"}')).toEqual({
      tab: 'overview',
      profileTab: 'core',
      unitTab: 'core',
    });
    expect(parseDeliveryNormsLocation('not-json')).toEqual({
      tab: 'overview',
      profileTab: 'core',
      unitTab: 'core',
    });
  });
});
