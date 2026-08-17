import { describe, expect, it } from 'vitest';
import {
  resolveRelationPickerMaxResults,
  resolveRelationPickerSearchDebounceMs,
} from './relation-picker-field-helpers';

describe('resolveRelationPickerMaxResults', () => {
  it('shows the full employee directory instead of 8 rows', () => {
    expect(resolveRelationPickerMaxResults('employee')).toBe(100);
    expect(resolveRelationPickerMaxResults('company')).toBe(8);
    expect(resolveRelationPickerMaxResults('employee', 12)).toBe(12);
  });
});

describe('resolveRelationPickerSearchDebounceMs', () => {
  it('skips debounce for employees', () => {
    expect(resolveRelationPickerSearchDebounceMs('employee')).toBe(0);
    expect(resolveRelationPickerSearchDebounceMs('contact')).toBe(150);
  });
});
