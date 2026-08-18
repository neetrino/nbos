import { describe, expect, it } from 'vitest';
import { isWhatsAppGroupChatId, normalizeWhatsAppGroupChatId } from './whatsapp-group-id';

describe('normalizeWhatsAppGroupChatId', () => {
  it('appends @g.us to a raw numeric group id', () => {
    expect(normalizeWhatsAppGroupChatId('120363012345678901')).toBe('120363012345678901@g.us');
  });

  it('keeps an already-suffixed id', () => {
    expect(normalizeWhatsAppGroupChatId('120363012345678901@g.us')).toBe('120363012345678901@g.us');
  });

  it('trims whitespace', () => {
    expect(normalizeWhatsAppGroupChatId('  120363012345678901  ')).toBe('120363012345678901@g.us');
  });

  it('does not invent a suffix for unrelated text', () => {
    expect(normalizeWhatsAppGroupChatId('not-a-group')).toBe('not-a-group');
    expect(isWhatsAppGroupChatId('not-a-group')).toBe(false);
  });
});
