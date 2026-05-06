import { describe, it, expect } from 'vitest';
import {
  deriveBaseInvoiceMoneyStatus,
  syncInvoiceMoneyStatusFromPayments,
} from './invoice-money-status';

const NOW = new Date('2026-05-05T12:00:00.000Z');

describe('deriveBaseInvoiceMoneyStatus', () => {
  it('returns PAID when payments cover amount', () => {
    expect(
      deriveBaseInvoiceMoneyStatus({
        amount: 100,
        paid: 100,
        dueDate: null,
        now: NOW,
      }),
    ).toBe('PAID');
  });

  it('returns OVERDUE when due date is in the past and not fully paid', () => {
    expect(
      deriveBaseInvoiceMoneyStatus({
        amount: 100,
        paid: 10,
        dueDate: new Date('2026-04-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('OVERDUE');
  });

  it('returns AWAITING_PAYMENT when partially paid and not overdue', () => {
    expect(
      deriveBaseInvoiceMoneyStatus({
        amount: 100,
        paid: 10,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('AWAITING_PAYMENT');
  });

  it('returns NEW when no payments and not overdue', () => {
    expect(
      deriveBaseInvoiceMoneyStatus({
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('NEW');
  });
});

describe('syncInvoiceMoneyStatusFromPayments', () => {
  it('returns PAID when payments cover amount regardless of hold', () => {
    expect(
      syncInvoiceMoneyStatusFromPayments({
        currentMoneyStatus: 'ON_HOLD',
        amount: 100,
        paid: 100,
        dueDate: null,
        now: NOW,
      }),
    ).toBe('PAID');
  });

  it('preserves ON_HOLD when not fully paid', () => {
    expect(
      syncInvoiceMoneyStatusFromPayments({
        currentMoneyStatus: 'ON_HOLD',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-01-01'),
        now: NOW,
      }),
    ).toBe('ON_HOLD');
  });

  it('preserves CANCELLED when not fully paid', () => {
    expect(
      syncInvoiceMoneyStatusFromPayments({
        currentMoneyStatus: 'CANCELLED',
        amount: 100,
        paid: 0,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('CANCELLED');
  });

  it('derives OVERDUE from due date when not on hold or cancelled', () => {
    expect(
      syncInvoiceMoneyStatusFromPayments({
        currentMoneyStatus: 'AWAITING_PAYMENT',
        amount: 100,
        paid: 10,
        dueDate: new Date('2026-04-01T00:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('OVERDUE');
  });
});
