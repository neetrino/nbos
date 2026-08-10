import { describe, expect, it } from 'vitest';
import {
  messengerLegacyWritesAllowed,
  messengerLegacyWsDualEmitEnabled,
  resolveMessengerLegacyWriteMode,
} from './messenger-legacy-write-mode';

describe('messenger legacy write mode', () => {
  it('defaults to enabled', () => {
    expect(resolveMessengerLegacyWriteMode({})).toBe('enabled');
    expect(messengerLegacyWritesAllowed({})).toBe(true);
  });

  it('honors read_only and disabled', () => {
    expect(resolveMessengerLegacyWriteMode({ MESSENGER_LEGACY_WRITE_MODE: 'read_only' })).toBe(
      'read_only',
    );
    expect(messengerLegacyWritesAllowed({ MESSENGER_LEGACY_WRITE_MODE: 'disabled' })).toBe(false);
  });

  it('dual-emits by default only while writes enabled', () => {
    expect(messengerLegacyWsDualEmitEnabled({ MESSENGER_LEGACY_WRITE_MODE: 'enabled' })).toBe(true);
    expect(messengerLegacyWsDualEmitEnabled({ MESSENGER_LEGACY_WRITE_MODE: 'disabled' })).toBe(
      false,
    );
    expect(
      messengerLegacyWsDualEmitEnabled({
        MESSENGER_LEGACY_WRITE_MODE: 'disabled',
        MESSENGER_LEGACY_WS_DUAL_EMIT: 'true',
      }),
    ).toBe(true);
  });
});
