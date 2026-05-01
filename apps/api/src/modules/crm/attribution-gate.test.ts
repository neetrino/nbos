import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  assertAttributionUpdateAllowed,
  getAttributionValidationErrors,
  mergeAttributionFields,
} from './attribution-gate';

describe('attribution-gate', () => {
  const completeSales: Parameters<typeof mergeAttributionFields>[0] = {
    source: 'SALES',
    sourceDetail: 'COLD_CALL',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
  };

  it('mergeAttributionFields applies partial patch', () => {
    const merged = mergeAttributionFields(completeSales, { sourceDetail: 'COLD_EMAIL' });
    expect(merged.sourceDetail).toBe('COLD_EMAIL');
    expect(merged.source).toBe('SALES');
  });

  it('assertAttributionUpdateAllowed skips when not locked', () => {
    expect(() =>
      assertAttributionUpdateAllowed({
        context: 'Lead',
        before: completeSales,
        patch: { source: null },
        locked: false,
      }),
    ).not.toThrow();
  });

  it('assertAttributionUpdateAllowed rejects invalid merged state when locked', () => {
    expect(() =>
      assertAttributionUpdateAllowed({
        context: 'Lead',
        before: completeSales,
        patch: { sourceDetail: null },
        locked: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('getAttributionValidationErrors requires which one for paid ads channels', () => {
    const errors = getAttributionValidationErrors({
      source: 'MARKETING',
      sourceDetail: 'LIST_AM',
      sourcePartnerId: null,
      sourceContactId: null,
      marketingAccountId: null,
      marketingActivityId: null,
    });
    expect(errors.some((e) => e.field === 'whichOne')).toBe(true);
  });
});
