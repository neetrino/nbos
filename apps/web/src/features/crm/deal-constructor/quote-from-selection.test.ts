import { describe, expect, it } from 'vitest';
import type { DealQuoteDto } from '@/lib/api/delivery-deal-quote';
import { quoteWithGradation, quoteWithToggledFunction } from './quote-from-selection';

const QUOTE: DealQuoteDto = {
  dealId: 'deal-1',
  appliedCollectionId: 'col-1',
  implementationBase: 'FROM_SCRATCH',
  designMode: 'AI_DESIGN',
  aiDesignerReview: false,
  coreProfileVersionId: 'core-1',
  items: [{ functionId: 'fn-1', tierId: 'tier-1' }],
};

describe('quoteFromSelection', () => {
  it('toggles a function off and clears the last-applied collection', () => {
    expect(quoteWithToggledFunction(QUOTE, 'fn-1')).toEqual({
      ...QUOTE,
      appliedCollectionId: null,
      items: [],
    });
  });

  it('adds a function and stores the chosen gradation', () => {
    const next = quoteWithGradation(QUOTE, 'fn-2', 'tier-2');
    expect(next.appliedCollectionId).toBeNull();
    expect(next.items).toEqual([
      { functionId: 'fn-1', tierId: 'tier-1' },
      { functionId: 'fn-2', tierId: 'tier-2' },
    ]);
  });
});
