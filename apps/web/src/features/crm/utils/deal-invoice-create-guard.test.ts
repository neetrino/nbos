import { describe, expect, it } from 'vitest';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/api-errors';
import {
  DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE,
  dealInvoiceCreateDeniedMessage,
} from './deal-invoice-create-guard';

describe('dealInvoiceCreateDeniedMessage', () => {
  it('returns permission copy before field eligibility', () => {
    expect(dealInvoiceCreateDeniedMessage(false, false)).toBe(PERMISSION_DENIED_MESSAGE);
    expect(dealInvoiceCreateDeniedMessage(false, true)).toBe(PERMISSION_DENIED_MESSAGE);
  });

  it('returns field copy when the user can add but the deal is incomplete', () => {
    expect(dealInvoiceCreateDeniedMessage(true, false)).toBe(DEAL_INVOICE_FIELDS_REQUIRED_MESSAGE);
  });

  it('returns null when create is allowed', () => {
    expect(dealInvoiceCreateDeniedMessage(true, true)).toBeNull();
  });
});
