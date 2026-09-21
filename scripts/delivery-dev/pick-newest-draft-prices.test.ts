import { describe, expect, it } from 'vitest';
import { pickNewestDraftsByTier } from './pick-newest-draft-prices';

describe('pickNewestDraftsByTier', () => {
  it('keeps the newest draft per card volume', () => {
    const picked = pickNewestDraftsByTier([
      { id: 'old-card', version: 1, tierId: null },
      { id: 'new-card', version: 3, tierId: null },
      { id: 'site-v1', version: 1, tierId: 'tier-site' },
      { id: 'site-v2', version: 2, tierId: 'tier-site' },
      { id: 'shop-v1', version: 1, tierId: 'tier-shop' },
    ]);

    expect(picked.map((row) => row.id).sort()).toEqual(['new-card', 'shop-v1', 'site-v2']);
  });
});
