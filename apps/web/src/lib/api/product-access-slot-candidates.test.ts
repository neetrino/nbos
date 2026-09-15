import { describe, expect, it } from 'vitest';
import { normalizeAccessSlotCandidatePage } from './product-access-slot-candidates';

const row = {
  id: 'c1',
  name: 'Beget',
  category: 'HOSTING',
  login: null,
  provider: null,
};

describe('normalizeAccessSlotCandidatePage', () => {
  it('keeps a paged payload', () => {
    expect(normalizeAccessSlotCandidatePage({ items: [row], hasMore: true })).toEqual({
      items: [row],
      hasMore: true,
    });
  });

  it('wraps a legacy bare array', () => {
    expect(normalizeAccessSlotCandidatePage([row])).toEqual({ items: [row], hasMore: false });
  });

  it('returns an empty page when the payload is missing', () => {
    expect(normalizeAccessSlotCandidatePage(undefined)).toEqual({ items: [], hasMore: false });
    expect(normalizeAccessSlotCandidatePage({ hasMore: true })).toEqual({
      items: [],
      hasMore: true,
    });
  });
});
