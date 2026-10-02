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

  it('does not block TRANSFER → DONE when the order is unpaid or only partially paid', () => {
    const errors = getExtensionStageGateErrors(
      {
        status: 'TRANSFER',
        tasks: [{ status: 'IN_PROGRESS' }],
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
});
