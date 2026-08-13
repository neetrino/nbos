import { describe, it, expect } from 'vitest';
import { resolveOrderStatus } from './finance-status.utils';
import type { ResolveOrderStatusOrderContext } from './finance-status.utils';

const TERM_SUBSCRIPTION_ORDER: ResolveOrderStatusOrderContext = {
  paymentType: 'SUBSCRIPTION',
  subscriptionTermMonths: 6,
  totalAmount: 600_000,
};

const NO_TERM_SUBSCRIPTION_ORDER: ResolveOrderStatusOrderContext = {
  paymentType: 'SUBSCRIPTION',
  subscriptionTermMonths: null,
  totalAmount: 100_000,
};

const CLASSIC_ORDER: ResolveOrderStatusOrderContext = {
  paymentType: 'CLASSIC',
  subscriptionTermMonths: null,
  totalAmount: 150_000,
};

describe('resolveOrderStatus', () => {
  describe('term subscription orders', () => {
    it('stays PARTIALLY_PAID after the first period is paid below contract total', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 100_000 }],
          },
        ],
        TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('reaches FULLY_PAID only when received money reaches the contract total', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 100_000 }],
          },
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 500_000 }],
          },
        ],
        TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).toBe('FULLY_PAID');
    });

    it('stays PENDING_PAYMENT when no money received and invoices await payment', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'AWAITING_PAYMENT',
            payments: [],
          },
        ],
        TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).toBe('PENDING_PAYMENT');
    });

    it('does not mark FULLY_PAID when all linked invoices are PAID but below contract total', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 100_000 }],
          },
        ],
        TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).not.toBe('FULLY_PAID');
      expect(status).toBe('PARTIALLY_PAID');
    });
  });

  describe('regression: classic and no-term subscription', () => {
    it('marks CLASSIC FULLY_PAID when all existing invoices are paid (unchanged)', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 50_000 }],
          },
        ],
        CLASSIC_ORDER,
      );

      expect(status).toBe('FULLY_PAID');
    });

    it('marks CLASSIC PARTIALLY_PAID when some payment exists and not all invoices are paid', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 50_000 }],
          },
          {
            moneyStatus: 'AWAITING_PAYMENT',
            payments: [],
          },
        ],
        CLASSIC_ORDER,
      );

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('marks no-term SUBSCRIPTION FULLY_PAID when all existing invoices are paid', () => {
      const status = resolveOrderStatus(
        [
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 100_000 }],
          },
        ],
        NO_TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).toBe('FULLY_PAID');
    });

    it('keeps invoice-driven behaviour when order context is omitted', () => {
      expect(
        resolveOrderStatus([
          {
            moneyStatus: 'PAID',
            payments: [{ amount: 10_000 }],
          },
        ]),
      ).toBe('FULLY_PAID');

      expect(
        resolveOrderStatus([
          {
            moneyStatus: 'AWAITING_PAYMENT',
            payments: [{ amount: 1_000 }],
          },
        ]),
      ).toBe('PARTIALLY_PAID');
    });
  });
});
