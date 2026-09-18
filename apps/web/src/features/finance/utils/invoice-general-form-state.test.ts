import { describe, expect, it } from 'vitest';
import type { Invoice } from '@/lib/api/finance';
import {
  buildInvoiceGeneralPatch,
  createInvoiceGeneralDraft,
  isInvoiceGeneralDirty,
} from './invoice-general-form-state';

const baseInvoice = {
  amount: '1000',
  taxStatus: 'TAX',
  companyId: 'c1',
  productId: 'p1',
  orderComment: null,
  notes: null,
} as Invoice;

describe('invoice-general-form-state notes', () => {
  it('creates a draft from invoice notes', () => {
    expect(createInvoiceGeneralDraft(baseInvoice).notes).toBe('');
    expect(createInvoiceGeneralDraft({ ...baseInvoice, notes: 'Keep' }).notes).toBe('Keep');
  });

  it('patches trimmed notes and clears empty to null', () => {
    const snap = createInvoiceGeneralDraft(baseInvoice);
    expect(buildInvoiceGeneralPatch(snap, { ...snap, notes: '  Next  ' })).toEqual({
      notes: 'Next',
    });
    expect(buildInvoiceGeneralPatch({ ...snap, notes: 'Next' }, { ...snap, notes: '  ' })).toEqual({
      notes: null,
    });
  });

  it('marks notes dirty', () => {
    const snap = createInvoiceGeneralDraft(baseInvoice);
    expect(isInvoiceGeneralDirty(snap, { ...snap, notes: 'Next' })).toBe(true);
    expect(isInvoiceGeneralDirty(snap, snap)).toBe(false);
  });
});
