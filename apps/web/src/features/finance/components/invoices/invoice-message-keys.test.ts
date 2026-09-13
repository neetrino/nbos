import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import enInvoices from '@/messages/en/invoices.json';
import ruInvoices from '@/messages/ru/invoices.json';
import {
  INVOICE_CATALOG_VALUE_SETS,
  INVOICE_PAYMENT_METHOD_MESSAGE_KEYS,
  INVOICE_REMINDER_SKIP_MESSAGE_KEYS,
  INVOICE_STAGE_MESSAGE_KEYS,
  INVOICE_STAGE_SHORT_MESSAGE_KEYS,
  INVOICE_TAX_MESSAGE_KEYS,
  INVOICE_TYPE_MESSAGE_KEYS,
  invoiceSourceMessageKey,
} from './invoice-message-keys';

describe('invoice message keys', () => {
  it('covers every INVOICE_* catalog value', () => {
    expect(Object.keys(INVOICE_STAGE_MESSAGE_KEYS)).toEqual([...INVOICE_CATALOG_VALUE_SETS.stages]);
    expect(Object.keys(INVOICE_STAGE_SHORT_MESSAGE_KEYS)).toEqual([
      ...INVOICE_CATALOG_VALUE_SETS.stages,
    ]);
    expect(Object.keys(INVOICE_TYPE_MESSAGE_KEYS)).toEqual([...INVOICE_CATALOG_VALUE_SETS.types]);
    expect(Object.keys(INVOICE_TAX_MESSAGE_KEYS)).toEqual([...INVOICE_CATALOG_VALUE_SETS.tax]);
    expect(Object.keys(INVOICE_PAYMENT_METHOD_MESSAGE_KEYS)).toEqual([
      ...INVOICE_CATALOG_VALUE_SETS.paymentMethods,
    ]);
  });

  it('maps source kinds without using catalog labels', () => {
    expect(invoiceSourceMessageKey({ order: { deal: { id: 'deal-1' } } })).toBe('source.deal');
    expect(invoiceSourceMessageKey({ orderId: 'ord-1' })).toBe('source.order');
    expect(invoiceSourceMessageKey({ subscriptionId: 'sub-1' })).toBe('source.subscription');
    expect(invoiceSourceMessageKey({ clientServiceRecordId: 'csr-1' })).toBeNull();
    expect(invoiceSourceMessageKey({ type: 'DEVELOPMENT' })).toBe('source.manual');
  });

  it('keeps EN/RU key parity', () => {
    expect(flattenMessageKeys(ruInvoices).sort()).toEqual(flattenMessageKeys(enInvoices).sort());
  });

  it('formats Russian reminder and create plurals for 0/1/2/5/11/21', () => {
    const t = createTranslator({ locale: 'ru', messages: { invoices: ruInvoices } });
    const waveCounts = [
      [0, '0 счетов → волна 1'],
      [1, '1 счёт → волна 1'],
      [2, '2 счёта → волна 1'],
      [5, '5 счетов → волна 1'],
      [11, '11 счетов → волна 1'],
      [21, '21 счёт → волна 1'],
    ] as const;
    for (const [count, expected] of waveCounts) {
      expect(t('invoices.reminders.wave1', { count })).toBe(expected);
    }
    expect(t('invoices.createSubscription.createdMany', { count: 1 })).toBe('1 счёт создан');
    expect(t('invoices.createSubscription.createdMany', { count: 2 })).toBe('2 счёта созданы');
    expect(t('invoices.createSubscription.createdMany', { count: 5 })).toBe('5 счетов создано');
    expect(INVOICE_REMINDER_SKIP_MESSAGE_KEYS.tax_gate).toBe('reminders.skip.tax_gate');
  });
});
