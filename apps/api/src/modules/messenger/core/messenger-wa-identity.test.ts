import { describe, expect, it } from 'vitest';
import {
  canAdvanceWhatsAppDelivery,
  isRetryableWhatsAppLifecycleSkip,
  whatsAppStatusesAllowedForOutboundWrite,
  whatsAppStatusesStrictlyBelow,
} from './messenger-wa-identity';

describe('WhatsApp delivery rank (FINDING-S8-05)', () => {
  it('allows ACK to repair OUTCOME_UNKNOWN to SENT/DELIVERED/READ', () => {
    expect(canAdvanceWhatsAppDelivery('OUTCOME_UNKNOWN', 'SENT')).toBe(true);
    expect(canAdvanceWhatsAppDelivery('OUTCOME_UNKNOWN', 'DELIVERED')).toBe(true);
    expect(canAdvanceWhatsAppDelivery('OUTCOME_UNKNOWN', 'READ')).toBe(true);
  });

  it('does not treat OUTCOME_UNKNOWN repair as a resend or FAILED/CANCELLED advance', () => {
    expect(canAdvanceWhatsAppDelivery('OUTCOME_UNKNOWN', 'SENDING')).toBe(false);
    expect(canAdvanceWhatsAppDelivery('OUTCOME_UNKNOWN', 'FAILED')).toBe(false);
    expect(canAdvanceWhatsAppDelivery('FAILED', 'READ')).toBe(false);
    expect(canAdvanceWhatsAppDelivery('CANCELLED', 'DELIVERED')).toBe(false);
  });

  it('includes OUTCOME_UNKNOWN in ACK CAS sources for delivery ticks', () => {
    expect(whatsAppStatusesStrictlyBelow('DELIVERED')).toEqual(
      expect.arrayContaining(['QUEUED', 'SENDING', 'SENT', 'OUTCOME_UNKNOWN']),
    );
    expect(whatsAppStatusesStrictlyBelow('READ')).toEqual(
      expect.arrayContaining(['DELIVERED', 'OUTCOME_UNKNOWN']),
    );
    expect(whatsAppStatusesStrictlyBelow('READ')).not.toContain('FAILED');
    expect(whatsAppStatusesStrictlyBelow('READ')).not.toContain('CANCELLED');
  });

  it('restricts outbound SENDING/SENT/FAILED/OUTCOME_UNKNOWN to QUEUED/SENDING', () => {
    expect(whatsAppStatusesAllowedForOutboundWrite('SENDING')).toEqual(['QUEUED', 'SENDING']);
    expect(whatsAppStatusesAllowedForOutboundWrite('SENT')).toEqual(['QUEUED', 'SENDING']);
    expect(whatsAppStatusesAllowedForOutboundWrite('FAILED')).toEqual(['QUEUED', 'SENDING']);
    expect(whatsAppStatusesAllowedForOutboundWrite('OUTCOME_UNKNOWN')).toEqual([
      'QUEUED',
      'SENDING',
    ]);
  });
});

describe('WhatsApp lifecycle skip retryability (FINDING-S8-07)', () => {
  it('treats MESSAGE_NOT_FOUND as retryable and terminal skips as not', () => {
    expect(isRetryableWhatsAppLifecycleSkip('MESSAGE_NOT_FOUND')).toBe(true);
    expect(isRetryableWhatsAppLifecycleSkip('FROM_ME_ECHO')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('INVALID_CHAT_ID')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('INTERNAL_ZONE_FORBIDDEN')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('UNKNOWN_ACK')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('ACK_NOT_ADVANCED')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('PROVIDER_REACTION_NO_EMPLOYEE')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('UNSUPPORTED_EVENT')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip('MISSING_MESSAGE_ID')).toBe(false);
    expect(isRetryableWhatsAppLifecycleSkip(null)).toBe(false);
  });
});
