import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertMessengerDeltaRecoveryEnabled,
  isMessengerDeltaRecoveryEnabled,
  parseMessengerDeltaRecoveryEnabled,
} from './messenger-core-recovery-flag';
import { MESSENGER_DELTA_DISABLED_CODE } from './messenger-core-revision.constants';

describe('Messenger delta recovery flag', () => {
  const previous = process.env.MESSENGER_DELTA_RECOVERY_ENABLED;

  afterEach(() => {
    if (previous === undefined) delete process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
    else process.env.MESSENGER_DELTA_RECOVERY_ENABLED = previous;
  });

  it('defaults to disabled and rejects invalid values', () => {
    expect(parseMessengerDeltaRecoveryEnabled(undefined)).toBe(false);
    expect(parseMessengerDeltaRecoveryEnabled('false')).toBe(false);
    expect(parseMessengerDeltaRecoveryEnabled('true')).toBe(true);
    expect(() => parseMessengerDeltaRecoveryEnabled('maybe')).toThrow(
      /MESSENGER_DELTA_RECOVERY_ENABLED/,
    );
  });

  it('makes delta endpoints unavailable while the flag is off', () => {
    process.env.MESSENGER_DELTA_RECOVERY_ENABLED = 'false';
    expect(isMessengerDeltaRecoveryEnabled()).toBe(false);
    try {
      assertMessengerDeltaRecoveryEnabled();
      throw new Error('expected 503');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: MESSENGER_DELTA_DISABLED_CODE,
      });
    }
  });

  it('allows delta after an explicit activation', () => {
    process.env.MESSENGER_DELTA_RECOVERY_ENABLED = 'true';
    expect(isMessengerDeltaRecoveryEnabled()).toBe(true);
    expect(() => assertMessengerDeltaRecoveryEnabled()).not.toThrow();
  });
});
