import { describe, expect, it } from 'vitest';
import { TAX_FREE_PAYMENT_CARD } from './client-payment-requisites';
import { formatCoverageMonthLabel, formatDueDateLabel } from './client-payment-reminder-templates';
import { renderOverdueReminderMessage } from './invoice-overdue-reminder-templates';

describe('overdue reminder templates', () => {
  it('renders wave 1 TAX in HY without pay-to block', () => {
    const message = renderOverdueReminderMessage({
      wave: 1,
      language: 'HY',
      source: 'subscription',
      serviceLabel: 'Site A',
      periodLabel: formatCoverageMonthLabel('2026-06', 'HY'),
      invoiceCode: 'INV-2026-0001',
      amount: 120000,
      taxStatus: 'TAX',
    });
    expect(message).toContain('ժամկետը լրացել է');
    expect(message).toContain('Site A');
    expect(message).toContain('INV-2026-0001');
    expect(message).toContain('120.000 դրամ');
    expect(message).toContain('դուրս գրված հաշվի');
    expect(message).toContain('անջատումից խուսափելու համար');
    expect(message).not.toContain(TAX_FREE_PAYMENT_CARD);
  });

  it('renders wave 2 by the issued invoice even when the invoice is tax free', () => {
    const message = renderOverdueReminderMessage({
      wave: 2,
      language: 'RU',
      source: 'subscription',
      serviceLabel: 'Site B',
      periodLabel: formatCoverageMonthLabel('2026-06', 'RU'),
      amount: 50000,
      taxStatus: 'TAX_FREE',
    });
    expect(message).toContain('всё ещё не поступила');
    expect(message).toContain('ежемесячный платёж «Site B»');
    expect(message).toContain('50.000 драм');
    expect(message).toContain('выставленному счёту');
    expect(message).not.toContain(TAX_FREE_PAYMENT_CARD);
    expect(message).toContain('напишите нам, чтобы избежать отключения');
  });

  it('renders wave 1 client service in EN', () => {
    const message = renderOverdueReminderMessage({
      wave: 1,
      language: 'EN',
      source: 'client_service',
      serviceLabel: 'example.com',
      periodLabel: formatDueDateLabel(new Date('2026-05-15T00:00:00+04:00'), 'EN'),
      amount: 25000,
      taxStatus: 'TAX',
    });
    expect(message).toContain('due date has passed');
    expect(message).toContain('example.com');
    expect(message).toContain('25.000 AMD');
    expect(message).toContain('official invoice');
  });
});
