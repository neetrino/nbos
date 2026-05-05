import { describe, it, expect } from 'vitest';
import { resolveInvoiceMoneyStatus } from './invoice-money-status';

const NOW = new Date('2026-05-05T12:00:00.000Z');

describe('resolveInvoiceMoneyStatus', () => {
  it('returns PAID when payments cover amount', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'WAITING',
        amount: 100,
        paid: 100,
        dueDate: null,
        now: NOW,
      }),
    ).toBe('PAID');
  });

  it('returns ON_HOLD when legacy is on hold and not fully paid', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'ON_HOLD',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-01-01'),
        now: NOW,
      }),
    ).toBe('ON_HOLD');
  });

  it('returns OVERDUE when due date is in the past and not fully paid', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'WAITING',
        amount: 100,
        paid: 10,
        dueDate: new Date('2026-04-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('OVERDUE');
  });

  it('returns OVERDUE when legacy is DELAYED', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'DELAYED',
        amount: 100,
        paid: 20,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('OVERDUE');
  });

  it('maps FAIL and WAITING to AWAITING_PAYMENT when not overdue', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'FAIL',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('AWAITING_PAYMENT');

    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'WAITING',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('AWAITING_PAYMENT');
  });

  it('maps THIS_MONTH and CREATE_INVOICE to NEW', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'THIS_MONTH',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('NEW');

    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'CREATE_INVOICE',
        amount: 100,
        paid: 0,
        dueDate: null,
        now: NOW,
      }),
    ).toBe('NEW');
  });

  it('treats inconsistent PAID legacy with partial coverage as AWAITING_PAYMENT', () => {
    expect(
      resolveInvoiceMoneyStatus({
        legacyStatus: 'PAID',
        amount: 100,
        paid: 50,
        dueDate: null,
        now: NOW,
      }),
    ).toBe('AWAITING_PAYMENT');
  });
});
