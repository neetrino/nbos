import { describe, expect, it } from 'vitest';
import { armeniaAtsHashPhone, googleContactPhoneValues } from './google-contacts-phone';

describe('armeniaAtsHashPhone', () => {
  it('adds #0 national twin for +374 mobiles', () => {
    expect(armeniaAtsHashPhone('+37477961718')).toBe('#077961718');
  });

  it('prefixes already-national 0 numbers', () => {
    expect(armeniaAtsHashPhone('077961718')).toBe('#077961718');
  });

  it('leaves non-Armenian numbers without a hash twin', () => {
    expect(armeniaAtsHashPhone('+12025550100')).toBeNull();
  });
});

describe('googleContactPhoneValues', () => {
  it('emits E.164 and ATS hash without duplicates', () => {
    expect(googleContactPhoneValues(['+37477961718', '077961718'])).toEqual([
      '+37477961718',
      '#077961718',
      '077961718',
    ]);
  });
});
