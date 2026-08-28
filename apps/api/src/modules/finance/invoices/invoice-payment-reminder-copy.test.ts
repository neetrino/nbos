import { describe, expect, it } from 'vitest';
import {
  renderResolvedPaymentReminderMessage,
  resolvePaymentReminderCopy,
} from './invoice-payment-reminder-copy';

describe('resolvePaymentReminderCopy', () => {
  it('uses subscription product name and language when present', () => {
    const copy = resolvePaymentReminderCopy({
      dueDate: new Date('2026-05-15T00:00:00+04:00'),
      coverageStartMonth: '2026-04',
      subscription: {
        reminderLanguage: 'RU',
        product: { name: 'Acme Site' },
      },
      clientServiceRecord: { name: 'ignored.am' },
    });
    expect(copy).toEqual({
      kind: 'subscription',
      language: 'RU',
      displayName: 'Acme Site',
      coverageStartMonth: '2026-04',
    });
  });

  it('uses CSR name and reminderLanguage when there is no subscription', () => {
    const copy = resolvePaymentReminderCopy({
      dueDate: new Date('2026-09-07T00:00:00+04:00'),
      coverageStartMonth: null,
      subscription: null,
      clientServiceRecord: { name: 'example.am domain', reminderLanguage: 'RU' },
    });
    expect(copy).toEqual({
      kind: 'client_service',
      language: 'RU',
      displayName: 'example.am domain',
      coverageStartMonth: '2026-09',
    });
  });
});

describe('renderResolvedPaymentReminderMessage', () => {
  it('renders client-service HY D-10 with the service name', () => {
    const text = renderResolvedPaymentReminderMessage(
      {
        kind: 'client_service',
        language: 'HY',
        displayName: 'example.am domain',
        coverageStartMonth: '2026-09',
      },
      10,
    );
    expect(text).toContain('example.am domain');
    expect(text).toContain('ծառայության');
  });
});
