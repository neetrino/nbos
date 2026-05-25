import { describe, it, expect } from 'vitest';
import { applyFinanceDriveUploadDefaults } from './drive-finance-upload-defaults';

describe('applyFinanceDriveUploadDefaults', () => {
  it('forces finance-restricted metadata for invoice uploads', () => {
    expect(
      applyFinanceDriveUploadDefaults('INVOICE', {
        purpose: undefined,
        visibility: 'INTERNAL',
        confidentiality: 'CONFIDENTIAL',
      }),
    ).toMatchObject({
      visibility: 'RESTRICTED',
      confidentiality: 'FINANCE_SENSITIVE',
      linkType: 'PROOF',
      purpose: 'INVOICE_REQUEST_PROOF',
      sourceModule: 'FINANCE',
    });
  });

  it('leaves non-finance entities unchanged aside from picks', () => {
    expect(applyFinanceDriveUploadDefaults('PROJECT', { visibility: 'INTERNAL' }).visibility).toBe(
      'INTERNAL',
    );
  });
});
