import { describe, expect, it } from 'vitest';
import { isPrimaryProductSlot } from './constants';
import { productSlotBindingsFromRow } from './product-slot-bindings';

describe('productSlotBindingsFromRow', () => {
  it('returns bindings only for set slot fields', () => {
    const bindings = productSlotBindingsFromRow({
      pmId: 'pm-1',
      developerId: 'dev-1',
      designerId: null,
    });
    expect(bindings).toHaveLength(2);
    expect(bindings[0]).toEqual({ field: 'pmId', slot: 'PM', employeeId: 'pm-1' });
    expect(bindings[1]).toEqual({
      field: 'developerId',
      slot: 'DEVELOPER',
      employeeId: 'dev-1',
    });
  });

  it('maps frontendDeveloperId to DEVELOPER_FRONTEND', () => {
    const bindings = productSlotBindingsFromRow({
      developerId: 'dev-1',
      frontendDeveloperId: 'fe-1',
    });
    expect(bindings).toEqual([
      { field: 'developerId', slot: 'DEVELOPER', employeeId: 'dev-1' },
      { field: 'frontendDeveloperId', slot: 'DEVELOPER_FRONTEND', employeeId: 'fe-1' },
    ]);
  });
});

describe('isPrimaryProductSlot', () => {
  it('marks Frontend as helper and Backend as primary', () => {
    expect(isPrimaryProductSlot('DEVELOPER')).toBe(true);
    expect(isPrimaryProductSlot('DEVELOPER_FRONTEND')).toBe(false);
    expect(isPrimaryProductSlot('PM')).toBe(true);
  });
});
