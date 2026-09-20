import { describe, expect, it } from 'vitest';
import { CatalogContentValidationError } from './catalog-write';
import { parseSizePresetBody } from './size-presets-write';

const FUNCTION_A = '11111111-1111-1111-1111-111111111111';
const FUNCTION_B = '22222222-2222-2222-2222-222222222222';

describe('parseSizePresetBody', () => {
  it('reads a preset for one profile and size', () => {
    expect(
      parseSizePresetBody({
        profileKey: 'SHOP_CODE_CLASSIC',
        configSize: 'CLASSIC',
        functionIds: [FUNCTION_A, FUNCTION_B],
      }),
    ).toEqual({
      profileKey: 'SHOP_CODE_CLASSIC',
      configSize: 'CLASSIC',
      functionIds: [FUNCTION_A, FUNCTION_B],
    });
  });

  it('accepts an empty preset, which clears the level', () => {
    expect(
      parseSizePresetBody({ profileKey: 'SHOP', configSize: 'SMALL', functionIds: [] }).functionIds,
    ).toEqual([]);
  });

  it('rejects an unknown size', () => {
    expect(() =>
      parseSizePresetBody({ profileKey: 'SHOP', configSize: 'HUGE', functionIds: [] }),
    ).toThrow(CatalogContentValidationError);
  });

  it('rejects a missing profile key', () => {
    expect(() =>
      parseSizePresetBody({ profileKey: '  ', configSize: 'SMALL', functionIds: [] }),
    ).toThrow(/profileKey is required/);
  });

  it('rejects a function id that is not an id', () => {
    expect(() =>
      parseSizePresetBody({
        profileKey: 'SHOP',
        configSize: 'SMALL',
        functionIds: ['BANK_PAYMENT'],
      }),
    ).toThrow(/must be a function id/);
  });

  it('rejects the same function twice', () => {
    expect(() =>
      parseSizePresetBody({
        profileKey: 'SHOP',
        configSize: 'SMALL',
        functionIds: [FUNCTION_A, FUNCTION_A],
      }),
    ).toThrow(/duplicate/);
  });

  it('ignores any attempt to smuggle money into a preset', () => {
    const parsed = parseSizePresetBody({
      profileKey: 'SHOP',
      configSize: 'SMALL',
      functionIds: [FUNCTION_A],
      units: 100,
      salePrice: 500000,
    });
    expect(Object.keys(parsed)).toEqual(['profileKey', 'configSize', 'functionIds']);
  });
});
