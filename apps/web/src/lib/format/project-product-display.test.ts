import { describe, expect, it } from 'vitest';
import {
  entityDisplayName,
  productDisplayName,
  projectDisplayName,
  stripEntityCodePrefix,
} from './project-product-display';

describe('stripEntityCodePrefix', () => {
  it('strips em-dash code prefix', () => {
    expect(stripEntityCodePrefix('BX-P-f36ec3ccb09b — 10xmarket.am')).toBe('10xmarket.am');
  });

  it('strips middle-dot code prefix', () => {
    expect(stripEntityCodePrefix('BX-P-f36ec3ccb09b · 10xmarket.am')).toBe('10xmarket.am');
  });

  it('keeps plain names', () => {
    expect(stripEntityCodePrefix('10xmarket.am')).toBe('10xmarket.am');
  });

  it('returns null for empty', () => {
    expect(stripEntityCodePrefix(null)).toBeNull();
    expect(stripEntityCodePrefix('  ')).toBeNull();
  });
});

describe('projectDisplayName / productDisplayName', () => {
  it('returns the name', () => {
    expect(projectDisplayName({ name: '10xmarket.am' })).toBe('10xmarket.am');
    expect(productDisplayName({ name: 'Hosting' })).toBe('Hosting');
  });

  it('returns null when name is missing', () => {
    expect(entityDisplayName({ name: null })).toBeNull();
    expect(entityDisplayName(null)).toBeNull();
  });

  it('strips composite names if callers pass them as name', () => {
    expect(projectDisplayName({ name: 'BX-P-1 — Alpha' })).toBe('Alpha');
  });
});
