import { describe, expect, it } from 'vitest';
import {
  canAdvanceMessengerDeliveryStatus,
  mergeMessengerDeliveryStatus,
} from './messenger-delivery-status';

describe('mergeMessengerDeliveryStatus', () => {
  it('does not let SENT overwrite DELIVERED or READ', () => {
    expect(mergeMessengerDeliveryStatus('DELIVERED', 'SENT')).toBe('DELIVERED');
    expect(mergeMessengerDeliveryStatus('READ', 'SENT')).toBe('READ');
    expect(canAdvanceMessengerDeliveryStatus('DELIVERED', 'SENT')).toBe(false);
  });

  it('does not let late SENDING overwrite terminal or ACK states', () => {
    expect(mergeMessengerDeliveryStatus('SENT', 'SENDING')).toBe('SENT');
    expect(mergeMessengerDeliveryStatus('FAILED', 'SENDING')).toBe('FAILED');
    expect(mergeMessengerDeliveryStatus('CANCELLED', 'SENT')).toBe('CANCELLED');
  });

  it('is idempotent for duplicates and can repair UNKNOWN to ACK', () => {
    expect(mergeMessengerDeliveryStatus('SENT', 'SENT')).toBe('SENT');
    expect(canAdvanceMessengerDeliveryStatus('SENT', 'SENT')).toBe(false);
    expect(mergeMessengerDeliveryStatus('OUTCOME_UNKNOWN', 'DELIVERED')).toBe('DELIVERED');
    expect(mergeMessengerDeliveryStatus('OUTCOME_UNKNOWN', 'SENDING')).toBe('OUTCOME_UNKNOWN');
  });
});
