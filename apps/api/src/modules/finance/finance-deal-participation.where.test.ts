import { describe, expect, it } from 'vitest';
import {
  buildInvoiceDealParticipationWhere,
  buildSubscriptionDealParticipationWhere,
} from './finance-deal-participation.where';

describe('finance-deal-participation.where', () => {
  it('scopes invoices to orders/deals for the seller graph', () => {
    const where = buildInvoiceDealParticipationWhere(['emp-1']);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { order: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
        {
          subscription: {
            project: {
              orders: { some: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
            },
          },
        },
      ]),
    );
    expect(where.OR).not.toEqual(
      expect.arrayContaining([{ project: expect.objectContaining({ OR: expect.any(Array) }) }]),
    );
  });

  it('scopes subscriptions to projects with seller deals', () => {
    expect(buildSubscriptionDealParticipationWhere(['emp-1'])).toEqual({
      project: {
        orders: { some: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
      },
    });
  });
});
