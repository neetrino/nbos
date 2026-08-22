import type { InputJsonValue } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';

const MAX_USER_AGENT_LENGTH = 256;
const MAX_CREDENTIAL_ID_LENGTH = 64;

function sanitizeCredentialId(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes(' ') || trimmed.length > MAX_CREDENTIAL_ID_LENGTH) {
    return undefined;
  }
  return trimmed;
}

function sanitizeUserAgent(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, MAX_USER_AGENT_LENGTH);
}

/** Persist only credential prefix and user agent. Never tokens or secrets. */
export function toSafeAuditClientMetadata(
  context: ActorContext,
): Record<string, string> | undefined {
  const credentialId = sanitizeCredentialId(context.client?.credentialId);
  const userAgent = sanitizeUserAgent(context.client?.userAgent);
  if (!credentialId && !userAgent) {
    return undefined;
  }
  return {
    ...(credentialId ? { credentialId } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

export function toAuditClientMetadataJson(context: ActorContext): InputJsonValue | undefined {
  return toSafeAuditClientMetadata(context) as InputJsonValue | undefined;
}
