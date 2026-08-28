import { describe, expect, it } from 'vitest';
import {
  TAX_FREE_PAYMENT_ACCOUNT,
  TAX_FREE_PAYMENT_CARD,
  TAX_FREE_PAYMENT_NAME,
} from './client-payment-requisites';
import {
  formatCoverageMonthLabel,
  formatDueDateLabel,
  renderClientPaymentReminderMessage,
} from './client-payment-reminder-templates';

describe('client payment reminder templates', () => {
  it('renders subscription D-2 TAX without pay-to block', () => {
    const message = renderClientPaymentReminderMessage({
      offsetDays: 2,
      language: 'HY',
      source: 'subscription',
      serviceLabel: 'Site A',
      periodLabel: 'հունիս 2026',
      amount: 120000,
      taxStatus: 'TAX',
    });
    expect(message).toContain('Խնդրում ենք 5 օրվա ընթացքում');
    expect(message).toContain('Site A');
    expect(message).toContain('120.000 դրամ');
    expect(message).toContain('դուրս գրված հաշվի');
    expect(message).not.toContain(TAX_FREE_PAYMENT_CARD);
    expect(message).not.toContain(TAX_FREE_PAYMENT_NAME);
  });

  it('renders subscription D-2 TAX_FREE with Hasmik pay-to block', () => {
    const message = renderClientPaymentReminderMessage({
      offsetDays: 2,
      language: 'RU',
      source: 'subscription',
      serviceLabel: 'Site B',
      periodLabel: 'за июнь 2026',
      amount: 50000,
      taxStatus: 'TAX_FREE',
    });
    expect(message).toContain('Просим в течение 5 дней оплатить');
    expect(message).toContain('Site B');
    expect(message).toContain('50.000 драм');
    expect(message).toContain(TAX_FREE_PAYMENT_CARD);
    expect(message).toContain(TAX_FREE_PAYMENT_ACCOUNT);
    expect(message).toContain(TAX_FREE_PAYMENT_NAME);
    expect(message).not.toContain('выставленному счёту');
  });

  it('renders client service D-2 in English with due date label', () => {
    const message = renderClientPaymentReminderMessage({
      offsetDays: 2,
      language: 'EN',
      source: 'client_service',
      serviceLabel: 'example.com',
      periodLabel: formatDueDateLabel(new Date('2026-05-15T00:00:00+04:00'), 'EN'),
      amount: 25000,
      taxStatus: 'TAX',
    });
    expect(message).toContain('service payment');
    expect(message).toContain('example.com');
    expect(message).toContain('25.000 AMD');
    expect(message).toContain('official invoice');
  });

  it('localizes coverage month for HY / RU / EN', () => {
    expect(formatCoverageMonthLabel('2026-06', 'HY')).toMatch(/2026/);
    expect(formatCoverageMonthLabel('2026-06', 'RU').toLowerCase()).toContain('июнь');
    expect(formatCoverageMonthLabel('2026-06', 'EN').toLowerCase()).toContain('june');
  });
});
