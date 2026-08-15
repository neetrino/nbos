import { describe, expect, it } from 'vitest';
import { isRawEntityIdLabel, relationPickerChipLabel } from './relation-picker-display-label';

const EMPLOYEE_ID = '14b22deb-5998-4bb5-aaba-f3ad5a0a8ff8';

describe('relationPickerChipLabel', () => {
  it('keeps a real first + last name', () => {
    expect(relationPickerChipLabel('Karo Gabrielyan', EMPLOYEE_ID)).toBe('Karo Gabrielyan');
  });

  it('hides a raw UUID fallback', () => {
    expect(relationPickerChipLabel(EMPLOYEE_ID, EMPLOYEE_ID)).toBe('');
    expect(isRawEntityIdLabel(EMPLOYEE_ID, EMPLOYEE_ID)).toBe(true);
  });

  it('hides a UUID even when it does not match the id', () => {
    expect(relationPickerChipLabel('a68acd1a-b712-4032-9063-57ad9554c3aa', EMPLOYEE_ID)).toBe('');
  });

  it('hides empty and whitespace labels', () => {
    expect(relationPickerChipLabel('  ', EMPLOYEE_ID)).toBe('');
    expect(relationPickerChipLabel(null, EMPLOYEE_ID)).toBe('');
  });

  it('strips project code prefixes from chip labels', () => {
    expect(relationPickerChipLabel('BX-P-f36ec3ccb09b — 10xmarket.am', 'proj-1')).toBe(
      '10xmarket.am',
    );
  });
});
