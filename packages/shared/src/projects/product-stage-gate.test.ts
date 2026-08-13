import { describe, expect, it } from 'vitest';
import { getProductStageGateErrors } from './product-stage-gate';

describe('getProductStageGateErrors', () => {
  it('requires description, deadline, and order for NEW → CREATING', () => {
    const errors = getProductStageGateErrors({ status: 'NEW' }, 'CREATING');
    expect(errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['description', 'deadline', 'order']),
    );
  });

  it('blocks DEVELOPMENT → QA when tasks are open', () => {
    const errors = getProductStageGateErrors(
      { status: 'DEVELOPMENT', tasks: [{ status: 'IN_PROGRESS' }] },
      'QA',
    );
    expect(errors).toEqual([{ field: 'tasks', message: expect.any(String) }]);
  });

  it('blocks TRANSFER → DONE when linked CLASSIC order is not fully paid', () => {
    const errors = getProductStageGateErrors(
      {
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
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
    const errors = getProductStageGateErrors(
      {
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
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
    const errors = getProductStageGateErrors(
      {
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
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

  it('allows TRANSFER → DONE when CLASSIC order is FULLY_PAID', () => {
    const errors = getProductStageGateErrors(
      {
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      },
      'DONE',
    );
    expect(errors).toEqual([]);
  });
});
