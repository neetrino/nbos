import { describe, expect, it } from 'vitest';
import { asActivityItems } from './activity';

describe('asActivityItems', () => {
  it('keeps only audit-shaped rows', () => {
    const items = asActivityItems([
      { id: '1', action: 'CREATED', entityType: 'EXTERNAL_AGENT', entityId: 'a', createdAt: 'x' },
      { id: 2 },
      null,
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.action).toBe('CREATED');
  });
});
