import { describe, expect, it } from 'vitest';
import { buildExtensionReadiness, getExtensionStageGateErrors } from './extension-stage-gate';

describe('extension stage gates', () => {
  it('requires description and assignee for NEW → DEVELOPMENT', () => {
    const errors = getExtensionStageGateErrors({ status: 'NEW' }, 'DEVELOPMENT');
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['description', 'assignedTo']),
    );
  });

  it('buildExtensionReadiness mirrors development gate fields', () => {
    const summary = buildExtensionReadiness({ status: 'NEW' });
    expect(summary.isReadyForDevelopment).toBe(false);
    expect(summary.missing).toHaveLength(2);
  });

  it('blocks TRANSFER → DONE when linked CLASSIC order is not fully paid', () => {
    const errors = getExtensionStageGateErrors(
      {
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      },
      'DONE',
    );
    expect(errors).toEqual([
      { field: 'finance', message: expect.stringContaining('PARTIALLY_PAID') },
    ]);
  });

  it('regression: allows TRANSFER → DONE when a subscription order is PARTIALLY_PAID and no invoices are unpaid', () => {
    const errors = getExtensionStageGateErrors(
      {
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      },
      'DONE',
    );
    expect(errors).toEqual([]);
  });

  it('still blocks TRANSFER → DONE when a subscription order has an unpaid invoice', () => {
    const errors = getExtensionStageGateErrors(
      {
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
        },
      },
      'DONE',
    );
    expect(errors).toEqual([{ field: 'finance', message: expect.stringContaining('invoices') }]);
  });
});
