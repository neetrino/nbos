const SIP_CHANNEL_PREFIX = /^SIP\//i;
const EXTENSION_SUFFIX = /-\d+$/;

/**
 * Normalize ATS `op` / SIP channel tokens to Employee.sipId.
 * `3103585` and `3103585-26` both become `3103585`.
 * Does not treat client phone numbers as extensions.
 */
export function normalizeAtsOperatorExtension(op: string | null | undefined): string | null {
  const trimmed = op?.trim();
  if (!trimmed) return null;
  const fromChannel = stripSipChannel(trimmed);
  const withoutSuffix = fromChannel.replace(EXTENSION_SUFFIX, '');
  const extension = withoutSuffix.trim();
  return extension.length > 0 ? extension : null;
}

function stripSipChannel(value: string): string {
  if (!SIP_CHANNEL_PREFIX.test(value)) return value;
  const token = value.replace(SIP_CHANNEL_PREFIX, '').split('/')[0] ?? value;
  return token.trim();
}
