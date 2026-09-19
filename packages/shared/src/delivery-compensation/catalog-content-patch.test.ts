import { describe, expect, it } from 'vitest';
import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
} from './catalog-write';
import { parseCatalogContentPatchBody } from './catalog-content-patch';

const VALID_PATCH = {
  title: 'Warehouse',
  summary: 'Stock',
  scopeBoundaries: 'One site',
  instructions: 'Receive',
  acceptanceCriteria: 'SKU listed',
};

describe('parseCatalogContentPatchBody', () => {
  it('rejects code changes and financial keys', () => {
    expect(() => parseCatalogContentPatchBody({ ...VALID_PATCH, code: 'new' })).toThrow(
      CatalogContentValidationError,
    );
    expect(() => parseCatalogContentPatchBody({ ...VALID_PATCH, units: '3' })).toThrow(
      CatalogFinancialMassAssignmentError,
    );
  });

  it('accepts content without inventing rates', () => {
    expect(parseCatalogContentPatchBody(VALID_PATCH)).toEqual(VALID_PATCH);
  });
});
