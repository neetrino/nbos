import { describe, expect, it } from 'vitest';
import { resolveDealWhatsAppBindId } from './deal-whatsapp-bind-id';

describe('resolveDealWhatsAppBindId', () => {
  it('prefers the selected list id', () => {
    expect(resolveDealWhatsAppBindId('APP', '120363408874132550@g.us')).toBe(
      '120363408874132550@g.us',
    );
  });

  it('accepts a typed group JID when nothing is selected', () => {
    expect(resolveDealWhatsAppBindId('120363408874132550@g.us', null)).toBe(
      '120363408874132550@g.us',
    );
    expect(resolveDealWhatsAppBindId('120363408874132550', '')).toBe('120363408874132550@g.us');
  });

  it('rejects a name-only search', () => {
    expect(resolveDealWhatsAppBindId('APP', null)).toBeNull();
  });
});
