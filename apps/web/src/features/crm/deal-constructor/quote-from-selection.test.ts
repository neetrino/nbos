import { describe, expect, it } from 'vitest';
import type { DealQuoteDto } from '@/lib/api/delivery-deal-quote';
import {
  quoteWithGradation,
  quoteWithToggledFunction,
  quoteWithoutAddedExtras,
} from './quote-from-selection';

const QUOTE: DealQuoteDto = {
  dealId: 'deal-1',
  appliedCollectionId: 'col-1',
  implementationBase: 'FROM_SCRATCH',
  designMode: 'AI_DESIGN',
  aiDesignerReview: false,
  coreProfileVersionId: 'core-1',
  coreVolumeFactor: '1.0',
  coreVolumeReason: null,
  items: [{ functionId: 'fn-1', tierId: 'tier-1', volumeFactor: '1.0', volumeReason: null }],
};

describe('quoteFromSelection', () => {
  it('toggles a function off and clears the last-applied collection', () => {
    expect(quoteWithToggledFunction(QUOTE, 'fn-1')).toEqual({
      ...QUOTE,
      appliedCollectionId: null,
      items: [],
    });
  });

  it('clears extras and keeps functions that already belong to the base', () => {
    const next = quoteWithoutAddedExtras(
      {
        ...QUOTE,
        items: [
          { functionId: 'base', tierId: null, volumeFactor: '1.0', volumeReason: null },
          { functionId: 'extra', tierId: null, volumeFactor: '1.2', volumeReason: 'kept' },
        ],
      },
      ['base'],
    );
    expect(next.appliedCollectionId).toBeNull();
    expect(next.items).toEqual([
      { functionId: 'base', tierId: null, volumeFactor: '1.0', volumeReason: null },
    ]);
  });

  it('adds a function and stores the chosen gradation', () => {
    const next = quoteWithGradation(QUOTE, 'fn-2', 'tier-2');
    expect(next.appliedCollectionId).toBeNull();
    expect(next.items).toEqual([
      { functionId: 'fn-1', tierId: 'tier-1', volumeFactor: '1.0', volumeReason: null },
      { functionId: 'fn-2', tierId: 'tier-2', volumeFactor: '1.0', volumeReason: null },
    ]);
  });
});
