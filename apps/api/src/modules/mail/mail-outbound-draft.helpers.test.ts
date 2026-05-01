import { describe, expect, it } from 'vitest';
import { dedupeEmailsCaseInsensitive } from './mail-outbound-draft.helpers';

describe('dedupeEmailsCaseInsensitive', () => {
  it('dedupes case-insensitively and trims', () => {
    expect(dedupeEmailsCaseInsensitive([' A@b.com ', 'a@b.com', 'x@y.co'])).toEqual([
      'A@b.com',
      'x@y.co',
    ]);
  });
});
