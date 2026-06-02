import { describe, expect, it } from 'vitest';
import { dedupeRecentCredentialIds } from './credential-recent-dedupe';

describe('dedupeRecentCredentialIds', () => {
  it('returns newest unique ids up to limit', () => {
    const ids = dedupeRecentCredentialIds(
      [
        { entityId: 'a', createdAt: new Date('2026-01-01') },
        { entityId: 'b', createdAt: new Date('2026-01-03') },
        { entityId: 'a', createdAt: new Date('2026-01-02') },
        { entityId: 'c', createdAt: new Date('2026-01-04') },
      ],
      2,
    );
    expect(ids).toEqual(['c', 'b']);
  });
});
