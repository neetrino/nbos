import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppClientInviteMessage,
  extractContactLanguage,
} from './whatsapp-client-invite-message.builder';

describe('buildWhatsAppClientInviteMessage', () => {
  it('builds Russian fallback message', () => {
    const result = buildWhatsAppClientInviteMessage({
      clientName: 'Anna',
      productName: 'Website',
      inviteUrl: 'https://chat.whatsapp.com/abc',
    });
    expect(result.locale).toBe('ru');
    expect(result.text).toContain('Anna');
    expect(result.text).toContain('Website');
    expect(result.text).toContain('https://chat.whatsapp.com/abc');
  });

  it('builds English when locale is en', () => {
    const result = buildWhatsAppClientInviteMessage({
      clientName: 'Anna',
      productName: 'App',
      inviteUrl: 'https://chat.whatsapp.com/xyz',
      locale: 'en',
    });
    expect(result.locale).toBe('en');
    expect(result.text).toContain('Hello');
  });
});

describe('extractContactLanguage', () => {
  it('reads messengerLinks.language', () => {
    expect(extractContactLanguage({ language: 'hy' })).toBe('hy');
    expect(extractContactLanguage(null)).toBeNull();
  });
});
