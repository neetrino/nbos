import { describe, expect, it } from 'vitest';
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
});
