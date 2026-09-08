import { describe, expect, it } from 'vitest';
import { buildInvoiceSearchOr } from './invoice-search.where';

describe('buildInvoiceSearchOr', () => {
  it('includes product name and matched product ids', () => {
    const where = buildInvoiceSearchOr('Site', ['proj-1'], ['prod-1']);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { product: { name: { contains: 'Site', mode: 'insensitive' } } },
        { productId: { in: ['prod-1'] } },
      ]),
    );
  });
});
