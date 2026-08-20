import { describe, expect, it } from 'vitest';
import { resolveProductClientContactId } from './resolve-product-client-contact';

describe('resolveProductClientContactId', () => {
  it('prefers Product, then Project, then Deal', () => {
    expect(
      resolveProductClientContactId({
        productContactId: 'p',
        projectContactId: 'proj',
        dealContactId: 'd',
      }),
    ).toBe('p');
    expect(
      resolveProductClientContactId({
        productContactId: null,
        projectContactId: 'proj',
        dealContactId: 'd',
      }),
    ).toBe('proj');
    expect(
      resolveProductClientContactId({
        productContactId: null,
        projectContactId: null,
        dealContactId: 'd',
      }),
    ).toBe('d');
    expect(resolveProductClientContactId({})).toBeNull();
  });
});
