import { describe, expect, it } from 'vitest';
import {
  formatCoverageMonthLabel,
  renderSubscriptionPaymentReminderMessage,
} from './subscription-payment-reminder-templates';
import { DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE } from '../subscriptions/subscription-reminder-language';
import { parseReminderLanguage } from '../subscriptions/subscription-reminder-language';

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

  it('renders D-10 necessary/subscription tone in all languages', () => {
    const hy = renderSubscriptionPaymentReminderMessage({
      offsetDays: 10,
      language: 'HY',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
    });
    const ru = renderSubscriptionPaymentReminderMessage({
      offsetDays: 10,
      language: 'RU',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
    });
    const en = renderSubscriptionPaymentReminderMessage({
      offsetDays: 10,
      language: 'EN',
      productName: 'Site A',
      coverageStartMonth: '2026-06',
    });
    expect(hy).toContain('Հարկավոր է');
    expect(hy).toContain('բաժանորդագրության');
    expect(hy).toContain('Site A');
    expect(ru).toContain('Необходимо оплатить ежемесячную подписку');
    expect(en).toContain('monthly subscription payment');
  });

  it('renders D-2 softer ask tone in all languages', () => {
    const hy = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'HY',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
    });
    const ru = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'RU',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
    });
    const en = renderSubscriptionPaymentReminderMessage({
      offsetDays: 2,
      language: 'EN',
      productName: 'Site B',
      coverageStartMonth: '2026-06',
    });
    expect(hy).toContain('Խնդրում ենք');
    expect(ru).toContain('Просим оплатить');
    expect(en).toContain('Kindly make the monthly payment');
  });
});
