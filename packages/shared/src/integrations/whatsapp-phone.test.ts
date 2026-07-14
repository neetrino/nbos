import { describe, expect, it } from 'vitest';
import {
  buildProductWhatsAppClientInviteDedupeKey,
  buildProductWhatsAppCreateDedupeKey,
  buildProductWhatsAppGroupName,
  buildProductWhatsAppParticipantDedupeKey,
  normalizePhoneToWhatsAppJid,
  toBullMqSafeJobId,
} from './whatsapp-phone';

describe('normalizePhoneToWhatsAppJid', () => {
  it('normalizes +374 formatted Armenian numbers', () => {
    const result = normalizePhoneToWhatsAppJid('+374 99 123456');
    expect(result).toEqual({
      success: true,
      digits: '37499123456',
      jid: '37499123456@c.us',
    });
  });

  it('accepts bare international digits', () => {
    expect(normalizePhoneToWhatsAppJid('37499123456')).toEqual({
      success: true,
      digits: '37499123456',
      jid: '37499123456@c.us',
    });
  });

  it('converts Armenian local 0-format with default AM', () => {
    expect(normalizePhoneToWhatsAppJid('099123456')).toEqual({
      success: true,
      digits: '37499123456',
      jid: '37499123456@c.us',
    });
  });

  it('converts 8-digit national AM without leading 0', () => {
    expect(normalizePhoneToWhatsAppJid('99123456')).toEqual({
      success: true,
      digits: '37499123456',
      jid: '37499123456@c.us',
    });
  });

  it('preserves explicit international non-AM numbers with +', () => {
    expect(normalizePhoneToWhatsAppJid('+12025550123')).toEqual({
      success: true,
      digits: '12025550123',
      jid: '12025550123@c.us',
    });
  });

  it('preserves explicit international without + when long enough', () => {
    expect(normalizePhoneToWhatsAppJid('12025550123')).toEqual({
      success: true,
      digits: '12025550123',
      jid: '12025550123@c.us',
    });
  });

  it('accepts already-formed JID without double suffix', () => {
    expect(normalizePhoneToWhatsAppJid('37499123456@c.us')).toEqual({
      success: true,
      digits: '37499123456',
      jid: '37499123456@c.us',
    });
  });

  it('rejects null/empty', () => {
    expect(normalizePhoneToWhatsAppJid(null).success).toBe(false);
    expect(normalizePhoneToWhatsAppJid('').success).toBe(false);
    expect(normalizePhoneToWhatsAppJid('   ').success).toBe(false);
  });

  it('rejects invalid text', () => {
    expect(normalizePhoneToWhatsAppJid('not-a-phone')).toEqual({
      success: false,
      reason: 'PHONE_INVALID',
    });
  });

  it('rejects too short numbers', () => {
    expect(normalizePhoneToWhatsAppJid('123')).toEqual({
      success: false,
      reason: 'PHONE_INVALID',
    });
  });
});

describe('whatsapp dedupe + name helpers', () => {
  it('builds stable keys', () => {
    expect(buildProductWhatsAppCreateDedupeKey('p1')).toBe('whatsapp-product-group:create:p1');
    expect(buildProductWhatsAppParticipantDedupeKey('p1', 'e1')).toBe(
      'whatsapp-product-group:p1:participant:e1',
    );
    expect(buildProductWhatsAppClientInviteDedupeKey('p1', 'c1', 'g@g.us')).toBe(
      'whatsapp-product-group:p1:client-invite:c1:g@g.us',
    );
  });

  it('builds bullmq-safe job ids deterministically', () => {
    const a = toBullMqSafeJobId('whatsapp-product-group:create:p1');
    const b = toBullMqSafeJobId('whatsapp-product-group:create:p1');
    expect(a).toBe(b);
    expect(a).toBe('whatsapp-product-group-create-p1');
  });

  it('builds group names', () => {
    expect(buildProductWhatsAppGroupName('ACME', 'Website')).toBe('ACME · Website');
    expect(buildProductWhatsAppGroupName('  ACME  ', '  Website  ')).toBe('ACME · Website');
  });
});
