import { describe, expect, it } from 'vitest';
import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
  parseCatalogContentWriteBody,
} from './catalog-write';

const VALID_BODY = {
  code: 'bank-payment',
  category: 'commerce',
  iconKey: 'CreditCard',
  title: 'Bank payment',
  summary: 'Accept card payouts',
  scopeBoundaries: 'Online checkout only',
  instructions: 'Wire the provider',
  acceptanceCriteria: 'Paid invoice appears',
};

describe('parseCatalogContentWriteBody', () => {
  it('accepts operational content without inventing units', () => {
    expect(parseCatalogContentWriteBody(VALID_BODY)).toEqual(VALID_BODY);
  });

  it('rejects units, rates and snapshots as mass-assignment', () => {
    expect(() => parseCatalogContentWriteBody({ ...VALID_BODY, units: '10' })).toThrow(
      CatalogFinancialMassAssignmentError,
    );
    expect(() => parseCatalogContentWriteBody({ ...VALID_BODY, rate: '1000' })).toThrow(
      CatalogFinancialMassAssignmentError,
    );
    expect(() =>
      parseCatalogContentWriteBody({ ...VALID_BODY, deliveryNormativeSnapshot: {} }),
    ).toThrow(CatalogFinancialMassAssignmentError);
  });

  it('rejects unknown icons and empty titles', () => {
    expect(() => parseCatalogContentWriteBody({ ...VALID_BODY, iconKey: 'NotAnIcon' })).toThrow(
      CatalogContentValidationError,
    );
    expect(() => parseCatalogContentWriteBody({ ...VALID_BODY, title: '  ' })).toThrow(
      CatalogContentValidationError,
    );
  });
});
