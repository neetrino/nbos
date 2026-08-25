import { describe, expect, it } from 'vitest';
import {
  buildOfficialInvoicePurpose,
  formatAmdAmount,
  renderOfficialInvoiceCancelMessage,
  renderOfficialInvoiceIssueMessage,
} from './invoice-official-whatsapp-templates';

describe('official invoice WhatsApp templates', () => {
  it('builds subscription purpose with coverage month', () => {
    const purpose = buildOfficialInvoicePurpose({
      type: 'SUBSCRIPTION',
      code: 'INV-1',
      productName: 'Acme Site',
      coverageStartMonth: '2026-05',
    });
    expect(purpose).toContain('Acme Site');
    expect(purpose).toContain('2026');
  });

  it('uses client service name for domain/service invoices', () => {
    expect(
      buildOfficialInvoicePurpose({
        type: 'DOMAIN',
        code: 'INV-2',
        clientServiceName: 'example.am',
      }),
    ).toBe('example.am');
  });

  it('renders issue and cancel Armenian copy with marks', () => {
    const fields = {
      code: 'INV-9',
      type: 'SUBSCRIPTION' as const,
      amount: 300000,
      companyName: 'Acme LLC',
      companyTaxId: '01234567',
      purpose: 'Acme Site',
    };
    const issue = renderOfficialInvoiceIssueMessage(fields);
    expect(issue).toContain('✅✅✅✅');
    expect(issue).toContain('IDINV-9');
    expect(issue).toContain('300000');
    const cancel = renderOfficialInvoiceCancelMessage(fields);
    expect(cancel).toContain('❌❌❌❌');
    expect(cancel).toContain('չեղարկել');
  });

  it('formats integer AMD without decimals', () => {
    expect(formatAmdAmount(120000)).toBe('120000');
    expect(formatAmdAmount(12.5)).toBe('12.50');
  });
});
