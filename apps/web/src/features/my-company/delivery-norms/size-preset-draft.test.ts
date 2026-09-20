import { DELIVERY_CONFIG_SIZES } from '@nbos/shared';
import { describe, expect, it } from 'vitest';
import type { SizePresetDto } from '@/lib/api/delivery-catalog-structure';
import {
  firstDeliveryConfigSize,
  functionIdsForSize,
  replaceSizePresetInList,
  sizePresetMap,
  togglePresetFunctionId,
  uniqueProfileKeys,
} from './size-preset-draft';

const FUNCTION_A = '11111111-1111-1111-1111-111111111111';
const FUNCTION_B = '22222222-2222-2222-2222-222222222222';

const PRESETS: SizePresetDto[] = [
  { profileKey: 'SHOP', configSize: 'SMALL', functionIds: [FUNCTION_A] },
  { profileKey: 'SHOP', configSize: 'CLASSIC', functionIds: [FUNCTION_A, FUNCTION_B] },
];

describe('firstDeliveryConfigSize', () => {
  it('returns the first shared config size', () => {
    expect(firstDeliveryConfigSize()).toBe('SMALL');
  });
});

describe('togglePresetFunctionId', () => {
  it('adds, removes and keeps the rest of the list', () => {
    expect(togglePresetFunctionId([], FUNCTION_A)).toEqual([FUNCTION_A]);
    expect(togglePresetFunctionId([FUNCTION_A], FUNCTION_A)).toEqual([]);
    expect(togglePresetFunctionId([FUNCTION_A], FUNCTION_B)).toEqual([FUNCTION_A, FUNCTION_B]);
  });
});

describe('uniqueProfileKeys', () => {
  it('keeps first-seen order without duplicates', () => {
    expect(
      uniqueProfileKeys([{ profileKey: 'SHOP' }, { profileKey: 'CRM' }, { profileKey: 'SHOP' }]),
    ).toEqual(['SHOP', 'CRM']);
  });
});

describe('sizePresetMap', () => {
  it('fills every config size and leaves missing levels empty', () => {
    const mapped = sizePresetMap(PRESETS);
    expect(Object.keys(mapped)).toEqual([...DELIVERY_CONFIG_SIZES]);
    expect(mapped.SMALL).toEqual([FUNCTION_A]);
    expect(mapped.CLASSIC).toEqual([FUNCTION_A, FUNCTION_B]);
    expect(mapped.LARGE).toEqual([]);
    expect(mapped.VERY_LARGE).toEqual([]);
    expect(mapped.ENTERPRISE).toEqual([]);
  });
});

describe('functionIdsForSize and replaceSizePresetInList', () => {
  it('reads one level and replaces that level only', () => {
    expect(functionIdsForSize(PRESETS, 'SMALL')).toEqual([FUNCTION_A]);
    expect(functionIdsForSize(PRESETS, 'LARGE')).toEqual([]);
    const next = replaceSizePresetInList(PRESETS, {
      profileKey: 'SHOP',
      configSize: 'SMALL',
      functionIds: [],
    });
    expect(functionIdsForSize(next, 'SMALL')).toEqual([]);
    expect(functionIdsForSize(next, 'CLASSIC')).toEqual([FUNCTION_A, FUNCTION_B]);
  });
});
