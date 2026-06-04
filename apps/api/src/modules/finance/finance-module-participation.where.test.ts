import { describe, expect, it } from 'vitest';
import {
  buildExpenseParticipationWhere,
  buildPaymentParticipationWhere,
  buildSubscriptionParticipationWhere,
} from './finance-module-participation.where';

describe('finance-module-participation.where', () => {
  it('scopes payments via invoice project graph', () => {
    const where = buildPaymentParticipationWhere(['emp-1']);
    expect(where.invoice).toEqual(expect.objectContaining({ OR: expect.any(Array) }));
  });

  it('scopes subscriptions and expenses via project participation', () => {
    expect(buildSubscriptionParticipationWhere(['emp-1']).project).toEqual(
      expect.objectContaining({ OR: expect.any(Array) }),
    );
    expect(buildExpenseParticipationWhere(['emp-1']).project).toEqual(
      expect.objectContaining({ OR: expect.any(Array) }),
    );
  });

  it('scopes seller payments via deal-linked invoices', () => {
    const where = buildPaymentParticipationWhere(['emp-1'], true);
    expect(where.invoice).toEqual(
      expect.objectContaining({
        OR: expect.arrayContaining([
          { order: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
        ]),
      }),
    );
  });
});
