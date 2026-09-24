import { describe, expect, it, vi } from 'vitest';
import { resetDealQuoteForProductTypeChange } from './reset-deal-quote-for-type-change';

describe('resetDealQuoteForProductTypeChange', () => {
  it('clears extras and the applied kit when the product type changes', async () => {
    const deleteMany = vi.fn();
    const update = vi.fn();
    const db = {
      deliveryDealQuote: {
        findUnique: vi.fn().mockResolvedValue({ id: 'quote-1' }),
        update,
      },
      deliveryDealQuoteItem: { deleteMany },
    };

    await resetDealQuoteForProductTypeChange(db, 'deal-1', 'ECOMMERCE', 'CRM');

    expect(deleteMany).toHaveBeenCalledWith({ where: { quoteId: 'quote-1' } });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'quote-1' },
      data: { appliedCollectionId: null },
    });
  });

  it('does nothing when the type did not change or no quote exists', async () => {
    const deleteMany = vi.fn();
    await resetDealQuoteForProductTypeChange(
      {
        deliveryDealQuote: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
        deliveryDealQuoteItem: { deleteMany },
      },
      'deal-1',
      'ECOMMERCE',
      'CRM',
    );
    await resetDealQuoteForProductTypeChange(
      {
        deliveryDealQuote: { findUnique: vi.fn(), update: vi.fn() },
        deliveryDealQuoteItem: { deleteMany },
      },
      'deal-1',
      'ECOMMERCE',
      'ECOMMERCE',
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
