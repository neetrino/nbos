import { describe, expect, it } from 'vitest';
import { buildInvoiceProjectParticipationWhere } from './finance-invoice-participation.where';

describe('buildInvoiceProjectParticipationWhere', () => {
  it('anchors invoices on project participation graph', () => {
    const where = buildInvoiceProjectParticipationWhere(['emp-1']);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { project: expect.objectContaining({ OR: expect.any(Array) }) },
        { subscription: { project: expect.objectContaining({ OR: expect.any(Array) }) } },
        { order: { project: expect.objectContaining({ OR: expect.any(Array) }) } },
      ]),
    );
  });
});
