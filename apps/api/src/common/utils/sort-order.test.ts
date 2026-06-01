import { describe, it, expect } from 'vitest';
import { resolveSortField, normalizeSortDirection } from './sort-order';

const ALLOWED = new Set(['createdAt', 'name', 'status']);

describe('resolveSortField', () => {
  it('returns the requested field when whitelisted', () => {
    expect(resolveSortField('name', ALLOWED, 'createdAt')).toBe('name');
  });

  it('falls back when sortBy is undefined', () => {
    expect(resolveSortField(undefined, ALLOWED, 'createdAt')).toBe('createdAt');
  });

  it('falls back when sortBy is not whitelisted', () => {
    expect(resolveSortField('password', ALLOWED, 'createdAt')).toBe('createdAt');
  });

  it('falls back on prototype-pollution-style keys', () => {
    expect(resolveSortField('__proto__', ALLOWED, 'createdAt')).toBe('createdAt');
    expect(resolveSortField('constructor', ALLOWED, 'createdAt')).toBe('createdAt');
  });
});

describe('normalizeSortDirection', () => {
  it('returns asc only for exact "asc"', () => {
    expect(normalizeSortDirection('asc')).toBe('asc');
  });

  it('defaults to desc for anything else', () => {
    expect(normalizeSortDirection('desc')).toBe('desc');
    expect(normalizeSortDirection(undefined)).toBe('desc');
    expect(normalizeSortDirection('DROP TABLE')).toBe('desc');
  });
});
