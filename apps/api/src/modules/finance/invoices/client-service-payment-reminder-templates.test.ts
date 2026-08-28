import { describe, expect, it } from 'vitest';
import { renderClientServicePaymentReminderMessage } from './client-service-payment-reminder-templates';

describe('renderClientServicePaymentReminderMessage', () => {
  it('renders RU D-10 copy with the service name and month', () => {
    const text = renderClientServicePaymentReminderMessage({
      offsetDays: 10,
      language: 'RU',
      serviceName: 'example.am domain',
      coverageStartMonth: '2026-09',
    });
    expect(text).toContain('example.am domain');
    expect(text).toContain('сентябрь 2026');
    expect(text).toContain('сервис');
  });

  it('renders HY and EN D-10 copy', () => {
    const hy = renderClientServicePaymentReminderMessage({
      offsetDays: 10,
      language: 'HY',
      serviceName: 'example.am domain',
      coverageStartMonth: '2026-09',
    });
    const en = renderClientServicePaymentReminderMessage({
      offsetDays: 10,
      language: 'EN',
      serviceName: 'example.am domain',
      coverageStartMonth: '2026-09',
    });
    expect(hy).toContain('ծառայության');
    expect(en).toContain('Please pay for the service');
    expect(en).toContain('September 2026');
  });
});
