import { describe, expect, it } from 'vitest';
import { buildOwnProfileUpdateData } from './employee-own-profile';

describe('buildOwnProfileUpdateData', () => {
  it('returns empty data when no fields are sent', () => {
    expect(buildOwnProfileUpdateData({})).toEqual({});
  });

  it('trims names and clears empty contacts', () => {
    expect(
      buildOwnProfileUpdateData({
        firstName: '  Anna  ',
        lastName: 'Petrosyan',
        phone: '  ',
        telegram: null,
        sipId: ' 3126 ',
      }),
    ).toEqual({
      firstName: 'Anna',
      lastName: 'Petrosyan',
      phone: null,
      telegram: null,
      sipId: '3126',
    });
  });

  it('parses birthday or clears it', () => {
    const withDate = buildOwnProfileUpdateData({ birthday: '1994-03-12T00:00:00.000Z' });
    expect(withDate.birthday).toBeInstanceOf(Date);
    expect(buildOwnProfileUpdateData({ birthday: null })).toEqual({ birthday: null });
  });
});
