import { describe, it, expect } from 'vitest';
import { isFinanceDriveEntity, resolveFinanceDriveUploadDefaults } from './finance-drive-upload';

describe('finance-drive-upload', () => {
  it('detects finance drive entities', () => {
    expect(isFinanceDriveEntity('INVOICE')).toBe(true);
    expect(isFinanceDriveEntity('PROJECT')).toBe(false);
  });

  it('returns restricted finance defaults for invoice', () => {
    expect(resolveFinanceDriveUploadDefaults('INVOICE')).toMatchObject({
      visibility: 'RESTRICTED',
      confidentiality: 'FINANCE_SENSITIVE',
      linkType: 'PROOF',
      purpose: 'INVOICE_REQUEST_PROOF',
    });
  });

  it('returns payment proof purpose for payment entity', () => {
    expect(resolveFinanceDriveUploadDefaults('PAYMENT')?.purpose).toBe('PAYMENT_PROOF');
  });
});
