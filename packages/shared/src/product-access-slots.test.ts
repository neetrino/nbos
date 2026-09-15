import { describe, expect, it } from 'vitest';
import {
  getAccessSlotsForProduct,
  getTypedAccessSlotsForProduct,
  resolveEffectiveAccessSlotKey,
  resolveSlotCreateCategory,
  UNIVERSAL_ACCESS_SLOT_KEY,
  UNIVERSAL_DEFAULT_CATEGORY,
} from './product-access-slots';

describe('getAccessSlotsForProduct', () => {
  it('returns domain and hosting for CODE websites', () => {
    const slots = getAccessSlotsForProduct('CODE', 'COMPANY_WEBSITE');
    const keys = slots.map((s) => s.slotKey);
    expect(keys).toContain('DOMAIN');
    expect(keys).toContain('HOSTING');
  });

  it('appends universal slot after typed slots', () => {
    const slots = getAccessSlotsForProduct('CODE', 'COMPANY_WEBSITE');
    expect(slots[slots.length - 1]?.slotKey).toBe(UNIVERSAL_ACCESS_SLOT_KEY);
  });

  it('adds app store slot for MOBILE_APP type', () => {
    const slots = getAccessSlotsForProduct('CODE', 'MOBILE_APP');
    expect(slots.some((s) => s.slotKey === 'APP_STORE')).toBe(true);
  });

  it('returns empty for unknown category', () => {
    expect(getAccessSlotsForProduct('UNKNOWN', 'OTHER')).toEqual([]);
  });
});

describe('resolveEffectiveAccessSlotKey', () => {
  it('routes UNIVERSAL + HOSTING category to HOSTING when hosting slot exists', () => {
    expect(
      resolveEffectiveAccessSlotKey(
        'CODE',
        'COMPANY_WEBSITE',
        UNIVERSAL_ACCESS_SLOT_KEY,
        'HOSTING',
      ),
    ).toBe('HOSTING');
  });

  it('routes UNIVERSAL + SERVICE to API_INTEGRATION before SERVICE when both allow SERVICE', () => {
    const typed = getTypedAccessSlotsForProduct('CODE', 'COMPANY_WEBSITE');
    const apiIndex = typed.findIndex((s) => s.slotKey === 'API_INTEGRATION');
    const serviceIndex = typed.findIndex((s) => s.slotKey === 'SERVICE');
    expect(apiIndex).toBeLessThan(serviceIndex);
    expect(
      resolveEffectiveAccessSlotKey(
        'CODE',
        'COMPANY_WEBSITE',
        UNIVERSAL_ACCESS_SLOT_KEY,
        'SERVICE',
      ),
    ).toBe('API_INTEGRATION');
  });

  it('keeps UNIVERSAL when category matches no typed slot', () => {
    expect(
      resolveEffectiveAccessSlotKey('MARKETING', 'OTHER', UNIVERSAL_ACCESS_SLOT_KEY, 'HOSTING'),
    ).toBe(UNIVERSAL_ACCESS_SLOT_KEY);
  });

  it('returns requested key unchanged when not UNIVERSAL', () => {
    expect(resolveEffectiveAccessSlotKey('CODE', 'COMPANY_WEBSITE', 'DOMAIN', 'HOSTING')).toBe(
      'DOMAIN',
    );
  });

  it('keeps UNIVERSAL for ENV and SSH and presets Service on create', () => {
    expect(UNIVERSAL_DEFAULT_CATEGORY).toBe('SERVICE');
    expect(
      resolveEffectiveAccessSlotKey('CODE', 'COMPANY_WEBSITE', UNIVERSAL_ACCESS_SLOT_KEY, 'ENV'),
    ).toBe(UNIVERSAL_ACCESS_SLOT_KEY);
    expect(
      resolveEffectiveAccessSlotKey('CODE', 'COMPANY_WEBSITE', UNIVERSAL_ACCESS_SLOT_KEY, 'SSH'),
    ).toBe(UNIVERSAL_ACCESS_SLOT_KEY);
  });
});

describe('resolveSlotCreateCategory', () => {
  it('presets Service for UNIVERSAL', () => {
    expect(
      resolveSlotCreateCategory({
        slotKey: UNIVERSAL_ACCESS_SLOT_KEY,
        allowedCategories: ['MAIL', 'SERVICE', 'API_KEY'],
        defaultCredentialType: 'LOGIN_PASSWORD',
      }),
    ).toBe('SERVICE');
  });

  it('presets the catalog pair of defaultCredentialType when several categories are allowed', () => {
    expect(
      resolveSlotCreateCategory({
        slotKey: 'API_INTEGRATION',
        allowedCategories: ['API_KEY', 'SERVICE'],
        defaultCredentialType: 'API_KEY',
      }),
    ).toBe('API_KEY');
    expect(
      resolveSlotCreateCategory({
        slotKey: 'ADMIN',
        allowedCategories: ['MAIL', 'SERVICE'],
        defaultCredentialType: 'LOGIN_PASSWORD',
      }),
    ).toBe('SERVICE');
  });
});
