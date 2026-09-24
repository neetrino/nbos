import { describe, expect, it, vi } from 'vitest';
import { readDragAccountId } from './mail-account-switcher-drag';

describe('readDragAccountId', () => {
  it('prefers the mail mime type over text/plain', () => {
    const event = {
      dataTransfer: {
        getData: vi.fn((type: string) => (type.includes('nbos-mail') ? 'acc-1' : 'fallback')),
      },
    } as never;
    expect(readDragAccountId(event)).toBe('acc-1');
  });
});
