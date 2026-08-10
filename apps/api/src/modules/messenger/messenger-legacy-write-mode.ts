/**
 * Legacy Internal Messenger mutation gate during unified cutover.
 * - enabled: legacy tables remain writable (default)
 * - read_only: legacy mutations rejected; reads OK
 * - disabled: legacy mutations rejected (same as read_only for writes)
 */
export type MessengerLegacyWriteMode = 'enabled' | 'read_only' | 'disabled';

export function resolveMessengerLegacyWriteMode(
  env: NodeJS.ProcessEnv = process.env,
): MessengerLegacyWriteMode {
  const raw = env.MESSENGER_LEGACY_WRITE_MODE?.trim().toLowerCase();
  if (raw === 'read_only' || raw === 'disabled') return raw;
  return 'enabled';
}

export function messengerLegacyWritesAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveMessengerLegacyWriteMode(env) === 'enabled';
}

/** Dual-emit channel/dm Socket.IO from unified path while legacy clients may still listen. */
export function messengerLegacyWsDualEmitEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.MESSENGER_LEGACY_WS_DUAL_EMIT?.trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off') return false;
  if (raw === '1' || raw === 'true' || raw === 'on') return true;
  // Default: dual-emit while legacy writes enabled; off when frozen.
  return messengerLegacyWritesAllowed(env);
}
