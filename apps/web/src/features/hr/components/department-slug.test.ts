import { describe, expect, it } from 'vitest';
import { slugFromDepartmentName, uniqueDepartmentSlug } from './department-slug';

describe('slugFromDepartmentName', () => {
  it('builds a single hyphenated slug', () => {
    expect(slugFromDepartmentName('  Sales & Ops  ')).toBe('sales-ops');
  });
});

describe('uniqueDepartmentSlug', () => {
  it('keeps the name slug when it is free', () => {
    expect(uniqueDepartmentSlug('Engineering', ['finance'])).toBe('engineering');
  });

  it('adds the next free suffix when the slug is taken', () => {
    expect(uniqueDepartmentSlug('Engineering', ['engineering', 'engineering-2'])).toBe(
      'engineering-3',
    );
  });
});
