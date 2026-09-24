import { describe, expect, it } from 'vitest';
import { isDeliveryNormsSection, sectionFromQuery } from './delivery-norms-workspace';

describe('isDeliveryNormsSection', () => {
  it('accepts the three page sections', () => {
    expect(isDeliveryNormsSection('core')).toBe(true);
    expect(isDeliveryNormsSection('functions')).toBe(true);
    expect(isDeliveryNormsSection('rates')).toBe(true);
    expect(isDeliveryNormsSection('sale')).toBe(false);
  });
});

describe('sectionFromQuery', () => {
  it('reads a valid section and maps leftover sale / units queries', () => {
    expect(sectionFromQuery('rates')).toBe('rates');
    expect(sectionFromQuery('sale')).toBe('functions');
    expect(sectionFromQuery('units')).toBe('core');
    expect(sectionFromQuery('unknown')).toBeNull();
    expect(sectionFromQuery(null)).toBeNull();
  });
});
