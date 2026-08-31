import { describe, expect, it } from 'vitest';
import { buildOfficialInvoicePurpose } from './invoice-official-note';
import {
  formatAmdAmount,
  renderOfficialInvoiceCancelMessage,
  renderOfficialInvoiceIssueMessage,
} from './invoice-official-whatsapp-templates';

describe('official invoice WhatsApp templates', () => {
  it('builds deal/order note from title, comment, and INV code', () => {
    const purpose = buildOfficialInvoicePurpose({
      code: 'INV-2026-0138',
      orderId: 'ord-1',
      orderCode: 'ORD-1',
      dealName: 'SEO Qualitech',
      dealCode: 'D-1',
      orderComment: 'FIRST_PHASE',
      subscriptionId: 'sub-1',
      subscriptionType: 'DEV_ONLY',
    });
    expect(purpose).toBe(
      ['SEO Qualitech', 'Աշխատանքների առաջին փուլի համար', 'INV-2026-0138'].join('\n'),
    );
  });

  it('builds auto-subscription note from type and coverage month', () => {
    const purpose = buildOfficialInvoicePurpose({
      code: 'INV-1',
      subscriptionId: 'sub-1',
      subscriptionName: 'Acme Site',
      subscriptionType: 'DEV_ONLY',
      coverageStartMonth: '2026-04',
    });
    expect(purpose).toContain('Acme Site');
    expect(purpose).toContain('մշակում');
    expect(purpose).toMatch(/ապրիլ 2026/i);
    expect(purpose).toContain('INV-1');
  });

  it('builds client-service note from type and due date', () => {
    const purpose = buildOfficialInvoicePurpose({
      code: 'INV-2',
      clientServiceRecordId: 'csr-1',
      clientServiceName: 'example.am',
      clientServiceType: 'DOMAIN',
      dueDate: new Date('2026-05-15T00:00:00+04:00'),
    });
    expect(purpose).toContain('example.am');
    expect(purpose).toContain('դոմեն');
    expect(purpose).toContain('մինչև');
    expect(purpose).toContain('INV-2');
  });

  it('renders issue and cancel Armenian copy without IDINV', () => {
    const fields = {
      code: 'INV-9',
      amount: 300000,
      companyName: 'Acme LLC',
      companyTaxId: '01234567',
      purpose: ['SEO Qualitech', 'Աշխատանքների առաջին փուլի համար', 'INV-9'].join('\n'),
    };
    const issue = renderOfficialInvoiceIssueMessage(fields);
    expect(issue).toContain('✅✅✅✅');
    expect(issue).toContain('Խնդրում եմ դուրս գրել հաշիվ');
    expect(issue).not.toContain('IDINV-9');
    expect(issue).toContain('Նշում՝');
    expect(issue).toContain('SEO Qualitech');
    expect(issue).toContain('300.000');
    const cancel = renderOfficialInvoiceCancelMessage(fields);
    expect(cancel).toContain('չեղարկել');
    expect(cancel).toContain('❌❌❌❌');
    expect(cancel).not.toContain('IDINV-9');
    expect(cancel).toContain('SEO Qualitech');
  });

  it('formats integer AMD with dot thousands grouping', () => {
    expect(formatAmdAmount(1000)).toBe('1.000');
    expect(formatAmdAmount(120000)).toBe('120.000');
    expect(formatAmdAmount(12.5)).toBe('12,50');
  });
});
