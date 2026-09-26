import { describe, expect, it } from 'vitest';
import { resolveEmployeeListStatusFilter } from './employee-list-status';

describe('resolveEmployeeListStatusFilter', () => {
  it('returns nothing when neither status nor exclude is set', () => {
    expect(resolveEmployeeListStatusFilter(undefined, undefined)).toBeUndefined();
  });

  it('excludes terminated people when that is the only constraint', () => {
    expect(resolveEmployeeListStatusFilter(undefined, 'TERMINATED')).toEqual({
      not: 'TERMINATED',
    });
  });

  it('keeps an exact status and ignores exclude', () => {
    expect(resolveEmployeeListStatusFilter('PROBATION', 'TERMINATED')).toBe('PROBATION');
  });

  it('ignores an unknown exclude value', () => {
    expect(resolveEmployeeListStatusFilter(undefined, 'FIRED')).toBeUndefined();
  });
});
