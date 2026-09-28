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

  it('does not block TRANSFER → DONE when the order is unpaid or only partially paid', () => {
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
          invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
        },
      },
      'DONE',
    );
    expect(errors).toEqual([]);
  });

  it('blocks TRANSFER → DONE when required access slots are empty', () => {
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
        missingRequiredAccessSlotKeys: ['DOMAIN', 'HOSTING'],
      },
      'DONE',
    );
    expect(errors).toEqual([
      { field: 'access', message: expect.stringContaining('DOMAIN, HOSTING') },
    ]);
  });

  it('blocks TRANSFER → DONE while delivery units are not published', () => {
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
        unpricedDeliveryNormatives: ['product base profile', 'LOYALTY'],
      },
      'DONE',
    );
    expect(errors).toEqual([
      {
        field: 'deliveryCompensation',
        message: expect.stringContaining('product base profile, LOYALTY'),
      },
    ]);
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
