import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppClientInviteMessage,
  extractContactLanguage,
} from './whatsapp-client-invite-message.builder';

describe('buildWhatsAppClientInviteMessage', () => {
  it('defaults to Armenian when locale is missing', () => {
    const result = buildWhatsAppClientInviteMessage({
      clientName: 'Anna',
      productName: 'Website',
      inviteUrl: 'https://chat.whatsapp.com/abc',
    });
    expect(result.locale).toBe('hy');
    expect(result.text).toContain('Anna');
    expect(result.text).toContain('Website');
    expect(result.text).toContain('https://chat.whatsapp.com/abc');
    expect(result.text).toContain('WhatsApp խումբ');
  });

  it('builds Russian when locale is russian', () => {
    const result = buildWhatsAppClientInviteMessage({
      clientName: 'Anna',
      productName: 'Website',
      inviteUrl: 'https://chat.whatsapp.com/abc',
      locale: 'RUSSIAN',
    });
    expect(result.locale).toBe('ru');
    expect(result.text).toContain('WhatsApp-группа');
  });

  it('builds Armenian when contact language is ARMENIAN', () => {
    const result = buildWhatsAppClientInviteMessage({
      clientName: 'Anna',
      productName: 'App',
      inviteUrl: 'https://chat.whatsapp.com/xyz',
      locale: 'ARMENIAN',
    });
    expect(result.locale).toBe('hy');
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
