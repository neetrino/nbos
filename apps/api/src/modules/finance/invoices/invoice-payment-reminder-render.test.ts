import { describe, expect, it } from 'vitest';
import { resolvePaymentReminderRenderInput } from './invoice-payment-reminder-render';

describe('resolvePaymentReminderRenderInput', () => {
  it('uses subscription display title and invoice code, not product name', () => {
    const resolved = resolvePaymentReminderRenderInput({
      code: 'INV-2026-0138',
      amount: 120000,
      taxStatus: 'TAX',
      coverageStartMonth: '2026-04',
      dueDate: new Date('2026-04-20T00:00:00+04:00'),
      subscription: {
        notificationsEnabled: true,
        reminderLanguage: 'HY',
        name: 'Acme maintenance',
        code: 'SUB-1',
        product: { name: 'Website product' },
      },
      clientServiceRecord: null,
    });
    expect(resolved?.renderInput.serviceLabel).toBe('Acme maintenance');
    expect(resolved?.renderInput.invoiceCode).toBe('INV-2026-0138');
  });
});
