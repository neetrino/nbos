import { describe, expect, it } from 'vitest';
import {
  formatCoverageMonthLabel,
  renderSubscriptionPaymentReminderMessage,
} from './subscription-payment-reminder-templates';
import { DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE } from '../subscriptions/subscription-reminder-language';
import { parseReminderLanguage } from '../subscriptions/subscription-reminder-language';
import { TAX_FREE_PAYMENT_CARD } from './client-payment-requisites';

describe('subscription payment reminder templates', () => {
  it('defaults reminder language to HY', () => {
    expect(parseReminderLanguage(undefined)).toBe(DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE);
    expect(parseReminderLanguage('')).toBe('HY');
  });

  it('localizes coverage month for HY / RU / EN', () => {
    expect(formatCoverageMonthLabel('2026-06', 'HY')).toMatch(/2026/);
    expect(formatCoverageMonthLabel('2026-06', 'RU').toLowerCase()).toContain('июнь');
    expect(formatCoverageMonthLabel('2026-06', 'EN').toLowerCase()).toContain('june');
  });

  it('renders the 5-day pay-window ask in all languages with amount', () => {
    const hy = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'HY',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
      amount: 120000,
      taxStatus: 'TAX',
    });
    const ru = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'RU',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
      amount: 120000,
      taxStatus: 'TAX',
    });
    const en = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'EN',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
      amount: 120000,
      taxStatus: 'TAX',
    });
    expect(hy).toContain('Խնդրում ենք 5 օրվա ընթացքում');
    expect(hy).toContain('բաժանորդագրության');
    expect(hy).toContain('Site A');
    expect(hy).toContain('120.000 դրամ');
    expect(ru).toContain('Просим в течение 5 дней оплатить ежемесячную подписку');
    expect(en).toContain('monthly subscription payment');
    expect(en).toContain('within 5 days');
  });

  it('renders the 5-day pay-window ask in all languages', () => {
    const hy = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'HY',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
      amount: 50000,
      taxStatus: 'TAX_FREE',
    });
    const ru = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'RU',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
      amount: 50000,
      taxStatus: 'TAX_FREE',
    });
    const en = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'EN',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
      amount: 50000,
      taxStatus: 'TAX_FREE',
    });
    expect(hy).toContain('Խնդրում ենք 5 օրվա ընթացքում');
    expect(hy).toContain(TAX_FREE_PAYMENT_CARD);
    expect(ru).toContain('Просим в течение 5 дней оплатить');
    expect(en).toContain('Please make the monthly subscription payment');
    expect(en).toContain('within 5 days');
  });
});
