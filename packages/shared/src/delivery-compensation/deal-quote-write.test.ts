import { describe, expect, it } from 'vitest';
import { parseDealQuoteApplyCollectionBody, parseDealQuoteBody } from './deal-quote-write';

const FUNCTION_A = '11111111-2222-3333-4444-555555555555';
const COLLECTION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('parseDealQuoteBody', () => {
  it('reads a replaceable draft composition', () => {
    expect(
      parseDealQuoteBody({
        implementationBase: 'FROM_SCRATCH',
        designMode: 'AI_DESIGN',
        items: [{ functionId: FUNCTION_A, tierId: null }],
      }),
    ).toEqual({
      implementationBase: 'FROM_SCRATCH',
      designMode: 'AI_DESIGN',
      aiDesignerReview: false,
      appliedCollectionId: null,
      items: [{ functionId: FUNCTION_A, tierId: null }],
    });
  });

  it('rejects a missing collection id on apply', () => {
    expect(() => parseDealQuoteApplyCollectionBody({})).toThrow(/collectionId is required/);
    expect(parseDealQuoteApplyCollectionBody({ collectionId: COLLECTION_ID })).toEqual({
      collectionId: COLLECTION_ID,
    });
  });
});
