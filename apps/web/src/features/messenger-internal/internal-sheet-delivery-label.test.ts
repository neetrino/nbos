import { describe, expect, it } from 'vitest';
import {
  internalSheetDeliveryLabel,
  internalSheetMessageSeen,
} from './internal-sheet-delivery-label';

describe('internalSheetDeliveryLabel', () => {
  it('treats a stored internal send as Delivered', () => {
    expect(internalSheetDeliveryLabel('SENT')).toBe('Delivered');
    expect(internalSheetDeliveryLabel('DELIVERED')).toBe('Delivered');
    expect(internalSheetDeliveryLabel('READ')).toBe('Read');
    expect(internalSheetDeliveryLabel(undefined)).toBeNull();
  });

  it('turns checks blue only after someone else has seen the message', () => {
    const sentAt = '2026-09-29T10:00:00.000Z';
    expect(internalSheetMessageSeen('SENT', sentAt, null)).toBe(false);
    expect(internalSheetMessageSeen('SENT', sentAt, '2026-09-29T09:00:00.000Z')).toBe(false);
    expect(internalSheetMessageSeen('SENT', sentAt, '2026-09-29T10:00:00.000Z')).toBe(true);
    expect(internalSheetMessageSeen('READ', sentAt, null)).toBe(true);
  });
});
