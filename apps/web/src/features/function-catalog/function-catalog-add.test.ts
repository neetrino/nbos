import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-errors';
import type { OperationalConfigurationDto } from '@/lib/api/delivery-configurations';
import { addFeatureErrorCode, addSelectedCatalogFunctions } from './function-catalog-add';

function configurationAtRevision(expectedRevision: number): OperationalConfigurationDto {
  return {
    id: 'cfg-1',
    productId: 'prod-1',
    extensionId: null,
    mode: 'V2',
    enrolled: true,
    designMode: null,
    aiDesignerReview: false,
    configSize: null,
    implementationBase: null,
    checkedAt: null,
    draftVersion: 1,
    expectedRevision,
    features: [],
  };
}

describe('addFeatureErrorCode', () => {
  it('reads the structured API code', () => {
    expect(
      addFeatureErrorCode(
        new ApiError('This function is already on the product.', {
          code: 'FUNCTION_ALREADY_SELECTED',
        }),
      ),
    ).toBe('FUNCTION_ALREADY_SELECTED');
    expect(addFeatureErrorCode(new Error('nope'))).toBeUndefined();
  });
});

describe('addSelectedCatalogFunctions', () => {
  it('carries the revision returned by each accepted change into the next call', async () => {
    const addFeature = vi
      .fn()
      .mockResolvedValueOnce(configurationAtRevision(6))
      .mockResolvedValueOnce(configurationAtRevision(7));

    const result = await addSelectedCatalogFunctions(
      {
        configurationId: 'cfg-1',
        functionIds: ['fn-1', 'fn-2'],
        expectedRevision: 5,
        reason: 'client asked for bank payment',
      },
      addFeature,
    );

    expect(result).toEqual({ addedIds: ['fn-1', 'fn-2'], error: null });
    expect(addFeature.mock.calls[0]).toEqual([
      'cfg-1',
      'fn-1',
      { reason: 'client asked for bank payment', expectedRevision: 5 },
    ]);
    expect(addFeature.mock.calls[1]?.[2]).toEqual({
      reason: 'client asked for bank payment',
      expectedRevision: 6,
    });
  });

  it('stops at the first refusal and reports what was already accepted', async () => {
    const conflict = new ApiError('stale', { code: 'CONFIGURATION_CONFLICT' });
    const addFeature = vi
      .fn()
      .mockResolvedValueOnce(configurationAtRevision(6))
      .mockRejectedValueOnce(conflict);

    const result = await addSelectedCatalogFunctions(
      { configurationId: 'cfg-1', functionIds: ['fn-1', 'fn-2', 'fn-3'], expectedRevision: 5 },
      addFeature,
    );

    expect(result.addedIds).toEqual(['fn-1']);
    expect(result.error).toBe(conflict);
    expect(addFeature).toHaveBeenCalledTimes(2);
  });
});
