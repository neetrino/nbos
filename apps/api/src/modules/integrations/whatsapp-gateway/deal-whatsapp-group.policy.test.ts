import { describe, expect, it } from 'vitest';
import {
  assertCanCreateDealLevelWhatsAppGroup,
  isDealLevelWhatsAppType,
} from './deal-whatsapp-group.policy';

describe('deal WhatsApp policy', () => {
  it('allows PRODUCT and OUTSOURCE only', () => {
    expect(isDealLevelWhatsAppType('PRODUCT')).toBe(true);
    expect(isDealLevelWhatsAppType('OUTSOURCE')).toBe(true);
    expect(isDealLevelWhatsAppType('EXTENSION')).toBe(false);
    expect(isDealLevelWhatsAppType('MAINTENANCE')).toBe(false);
  });

  it('requires Contact for create', () => {
    expect(() =>
      assertCanCreateDealLevelWhatsAppGroup({ dealType: 'PRODUCT', contactId: null }),
    ).toThrow(/Contact/);
    expect(() =>
      assertCanCreateDealLevelWhatsAppGroup({ dealType: 'EXTENSION', contactId: 'c1' }),
    ).toThrow(/PRODUCT and OUTSOURCE/);
  });
});
