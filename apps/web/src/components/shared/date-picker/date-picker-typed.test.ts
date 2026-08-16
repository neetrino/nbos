import { describe, expect, it } from 'vitest';
import {
  adjacentTypedDatePart,
  formatTypedDateParts,
  parseTypedDateParts,
  sanitizeTypedDatePart,
  shouldAdvanceTypedDatePart,
} from './date-picker-typed';

describe('parseTypedDateParts', () => {
  it('builds a date from day, month, and year in any filled order', () => {
    const parsed = parseTypedDateParts({ day: '15', month: '12', year: '2026' });
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(11);
    expect(parsed?.getDate()).toBe(15);
  });

  it('accepts a single-digit day or month and a two-digit year', () => {
    const parsed = parseTypedDateParts({ day: '5', month: '3', year: '26' });
    expect(parsed?.getDate()).toBe(5);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getFullYear()).toBe(2026);
  });

  it('rejects incomplete or impossible parts', () => {
    expect(parseTypedDateParts({ day: '15', month: '12', year: '' })).toBeUndefined();
    expect(parseTypedDateParts({ day: '15', month: '12', year: '202' })).toBeUndefined();
    expect(parseTypedDateParts({ day: '31', month: '2', year: '2026' })).toBeUndefined();
    expect(parseTypedDateParts({ day: '15', month: '13', year: '2026' })).toBeUndefined();
  });
});

describe('formatTypedDateParts', () => {
  it('splits a date into cell values', () => {
    expect(formatTypedDateParts(new Date(2026, 11, 15))).toEqual({
      day: '15',
      month: '12',
      year: '2026',
    });
  });
});

describe('typed date cell helpers', () => {
  it('keeps only digits up to the part max', () => {
    expect(sanitizeTypedDatePart('day', '1a5')).toBe('15');
    expect(sanitizeTypedDatePart('year', '20261')).toBe('2026');
  });

  it('advances when a cell is unambiguously complete', () => {
    expect(shouldAdvanceTypedDatePart('day', '5')).toBe(true);
    expect(shouldAdvanceTypedDatePart('day', '15')).toBe(true);
    expect(shouldAdvanceTypedDatePart('day', '1')).toBe(false);
    expect(shouldAdvanceTypedDatePart('month', '3')).toBe(true);
    expect(shouldAdvanceTypedDatePart('month', '1')).toBe(false);
    expect(shouldAdvanceTypedDatePart('year', '2026')).toBe(true);
    expect(shouldAdvanceTypedDatePart('year', '26')).toBe(false);
  });

  it('moves to the neighboring cell', () => {
    expect(adjacentTypedDatePart('day', 1)).toBe('month');
    expect(adjacentTypedDatePart('year', -1)).toBe('month');
    expect(adjacentTypedDatePart('day', -1)).toBeUndefined();
  });
});
