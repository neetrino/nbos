import { describe, expect, it } from 'vitest';
import { latestPeerReadAt } from './messenger-core-internal-messages.ops';

describe('latestPeerReadAt', () => {
  it('keeps the newest other-participant cursor', () => {
    expect(latestPeerReadAt([])).toBeNull();
    expect(
      latestPeerReadAt([
        { lastReadAt: new Date('2026-09-29T09:00:00.000Z') },
        { lastReadAt: new Date('2026-09-29T11:00:00.000Z') },
      ]),
    ).toBe('2026-09-29T11:00:00.000Z');
  });
});
