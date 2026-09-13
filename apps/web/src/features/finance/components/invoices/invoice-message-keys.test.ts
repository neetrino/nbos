import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import enInvoices from '@/messages/en/invoices.json';
import ruInvoices from '@/messages/ru/invoices.json';
import { INVOICE_PAYMENT_METHOD_OPTIONS } from '@/features/finance/constants/finance';
import {
  INVOICE_PAYMENT_METHOD_MESSAGE_KEYS,
  invoicePaymentMethodMessageKey,
  invoiceTaxMessageKey,
  officialInvoiceRequestStatusKey,
} from './invoice-message-keys';
import { invoicePaymentMethodSelectOptions } from './invoice-payment-method-options';

describe('invoice payment/history message keys', () => {
  it('covers every payment method option', () => {
    expect(Object.keys(INVOICE_PAYMENT_METHOD_MESSAGE_KEYS).sort()).toEqual(
      INVOICE_PAYMENT_METHOD_OPTIONS.map((option) => option.value).sort(),
    );
  });

  it('resolves payment method and tax keys only for known values', () => {
    expect(invoicePaymentMethodMessageKey('TRANSACTION')).toBe('paymentMethod.TRANSACTION');
    expect(invoicePaymentMethodMessageKey('CASH')).toBe('paymentMethod.CASH');
    expect(invoicePaymentMethodMessageKey('WIRE')).toBeNull();
    expect(invoiceTaxMessageKey('TAX')).toBe('tax.TAX');
    expect(invoiceTaxMessageKey('TAX_FREE')).toBe('tax.TAX_FREE');
    expect(invoiceTaxMessageKey('OTHER')).toBeNull();
  });

  it('maps official request status without translating dates', () => {
    expect(
      officialInvoiceRequestStatusKey(
        { officialInvoiceRequestSent: true, officialInvoiceCancelledAt: null },
        false,
      ),
    ).toEqual({ key: 'official.status.sent', variant: 'green' });
    expect(
      officialInvoiceRequestStatusKey(
        { officialInvoiceRequestSent: false, officialInvoiceCancelledAt: null },
        true,
      ),
    ).toEqual({ key: 'official.status.sending', variant: 'amber' });
    expect(
      officialInvoiceRequestStatusKey(
        { officialInvoiceRequestSent: false, officialInvoiceCancelledAt: '2026-09-01' },
        false,
      ),
    ).toEqual({ key: 'official.status.cancelled', variant: 'amber' });
    expect(
      officialInvoiceRequestStatusKey(
        { officialInvoiceRequestSent: false, officialInvoiceCancelledAt: null },
        false,
      ),
    ).toEqual({ key: 'official.status.notSent', variant: 'gray' });
  });

  it('translates payment method labels only when catalog keys exist', () => {
    const withKeys = invoicePaymentMethodSelectOptions(
      (key) => (key === 'paymentMethod.CASH' ? 'Наличные' : 'Перевод'),
      () => true,
    );
    expect(withKeys).toEqual([
      { value: 'TRANSACTION', label: 'Перевод' },
      { value: 'CASH', label: 'Наличные' },
    ]);

    const withoutKeys = invoicePaymentMethodSelectOptions(
      () => 'unused',
      () => false,
    );
    expect(withoutKeys).toEqual(
      INVOICE_PAYMENT_METHOD_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    );
  });

  it('keeps EN/RU keys aligned for payment, history, money, official, and lifecycle', () => {
    expect(flattenMessageKeys(enInvoices).sort()).toEqual(flattenMessageKeys(ruInvoices).sort());
  });

  it('interpolates payment amounts without translating them', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { invoices: ruInvoices },
    });
    expect(t('invoices.payments.removeAria', { amount: '12 000 AMD' })).toBe(
      'Удалить платёж 12 000 AMD',
    );
    expect(t('invoices.official.sentAt', { date: '12 сент. 2026 г.' })).toContain('12 сент. 2026');
  });
});
