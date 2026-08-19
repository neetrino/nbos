import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  CONTACT_PHONE_ERROR,
  assertStoredContactPhone,
  contactAnyPhoneOr,
  contactOwnsPhone,
  contactPhoneLookupWhere,
  deleteOverlappingExtraPhones,
  unionExtraPhoneE164,
} from './contact-phone.ops';

describe('contactPhoneLookupWhere', () => {
  it('matches primary and extra phones with ATS variants', () => {
    const where = contactPhoneLookupWhere('+374 99 123456');
    expect(where).toEqual(
      contactAnyPhoneOr(['+37499123456', '37499123456', '099123456', '99123456']),
    );
  });

  it('returns null for empty input', () => {
    expect(contactPhoneLookupWhere('   ')).toBeNull();
  });
});

describe('contactOwnsPhone', () => {
  it('treats a matching extra as already owned', () => {
    expect(contactOwnsPhone('+37499000000', [{ e164: '+37499111111' }], '+374 99 111111')).toBe(
      true,
    );
  });

  it('does not treat a different number as owned', () => {
    expect(contactOwnsPhone('+37499000000', [{ e164: '+37499111111' }], '+37499222222')).toBe(
      false,
    );
  });
});

describe('assertStoredContactPhone', () => {
  it('rejects empty junk', () => {
    expect(() => assertStoredContactPhone('   ')).toThrow(BadRequestException);
    try {
      assertStoredContactPhone('');
    } catch (err) {
      expect(err).toMatchObject({ response: { code: CONTACT_PHONE_ERROR.EMPTY } });
    }
  });

  it('normalizes a valid number to e164', () => {
    expect(assertStoredContactPhone('+374 99 123456')).toBe('+37499123456');
  });
});

describe('unionExtraPhoneE164', () => {
  it('drops the chosen primary and duplicate variants', () => {
    expect(
      unionExtraPhoneE164('+37499222222', [
        '+37499000000',
        '+374 99 000000',
        '+37499222222',
        '+37499333333',
      ]),
    ).toEqual(['+37499000000', '+37499333333']);
  });
});

describe('deleteOverlappingExtraPhones', () => {
  it('deletes extras that match the new primary variants', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    await deleteOverlappingExtraPhones(
      { contactPhone: { deleteMany } } as never,
      'c-1',
      '+37499123456',
    );
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        contactId: 'c-1',
        e164: { in: expect.arrayContaining(['+37499123456']) },
      },
    });
  });
});
