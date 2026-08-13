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

function paidInvoice(amount: number) {
  return { moneyStatus: 'PAID' as const, payments: [{ amount }] };
}

function awaitingInvoice() {
  return { moneyStatus: 'AWAITING_PAYMENT' as const, payments: [] };
}

describe('resolveOrderStatus', () => {
  describe('term subscription orders', () => {
    it('stays PARTIALLY_PAID after the first period is paid below contract total', () => {
      const status = resolveOrderStatus([paidInvoice(100_000)], TERM_SUBSCRIPTION_ORDER);

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('reaches FULLY_PAID only when received money reaches the contract total', () => {
      const status = resolveOrderStatus(
        [paidInvoice(100_000), paidInvoice(500_000)],
        TERM_SUBSCRIPTION_ORDER,
      );

      expect(status).toBe('FULLY_PAID');
    });

    it('stays PENDING_PAYMENT when no money received and invoices await payment', () => {
      const status = resolveOrderStatus([awaitingInvoice()], TERM_SUBSCRIPTION_ORDER);

      expect(status).toBe('PENDING_PAYMENT');
    });

    it('does not mark FULLY_PAID when all linked invoices are PAID but below contract total', () => {
      const status = resolveOrderStatus([paidInvoice(100_000)], TERM_SUBSCRIPTION_ORDER);

      expect(status).not.toBe('FULLY_PAID');
      expect(status).toBe('PARTIALLY_PAID');
    });
  });

  describe('classic orders', () => {
    it('stays PARTIALLY_PAID when the deposit is paid and the remainder is not yet invoiced', () => {
      const status = resolveOrderStatus([paidInvoice(50_000)], CLASSIC_ORDER);

      expect(status).not.toBe('FULLY_PAID');
      expect(status).toBe('PARTIALLY_PAID');
    });

    it('reaches FULLY_PAID when received money equals the contract total', () => {
      const status = resolveOrderStatus([paidInvoice(50_000), paidInvoice(100_000)], CLASSIC_ORDER);

      expect(status).toBe('FULLY_PAID');
    });

    it('reaches FULLY_PAID when received money exceeds the contract total', () => {
      const status = resolveOrderStatus([paidInvoice(160_000)], CLASSIC_ORDER);

      expect(status).toBe('FULLY_PAID');
    });

    it('falls back to invoice-driven status when totalAmount is zero', () => {
      const status = resolveOrderStatus([paidInvoice(50_000), awaitingInvoice()], {
        ...CLASSIC_ORDER,
        totalAmount: 0,
      });

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('falls back to invoice-driven status when totalAmount is negative or unusable', () => {
      const mixed = [paidInvoice(50_000), awaitingInvoice()];
      expect(resolveOrderStatus(mixed, { ...CLASSIC_ORDER, totalAmount: -1 })).toBe(
        'PARTIALLY_PAID',
      );
      expect(
        resolveOrderStatus([paidInvoice(50_000)], {
          ...CLASSIC_ORDER,
          totalAmount: 'not-a-number',
        }),
      ).toBe('FULLY_PAID');
    });

    it('marks CLASSIC PARTIALLY_PAID when some payment exists and not all invoices are paid', () => {
      const status = resolveOrderStatus([paidInvoice(50_000), awaitingInvoice()], CLASSIC_ORDER);

      expect(status).toBe('PARTIALLY_PAID');
    });

    it('stays PENDING_PAYMENT when no money received and invoices await payment', () => {
      const status = resolveOrderStatus([awaitingInvoice()], CLASSIC_ORDER);

      expect(status).toBe('PENDING_PAYMENT');
    });
  });

  describe('regression: open-ended subscription and omitted context', () => {
    it('marks no-term SUBSCRIPTION FULLY_PAID when all existing invoices are paid', () => {
      const status = resolveOrderStatus([paidInvoice(100_000)], NO_TERM_SUBSCRIPTION_ORDER);

      expect(status).toBe('FULLY_PAID');
    });

    it('keeps invoice-driven behaviour when order context is omitted', () => {
      expect(resolveOrderStatus([paidInvoice(10_000)])).toBe('FULLY_PAID');

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
