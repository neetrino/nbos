import { randomBytes } from 'node:crypto';

/**
 * Opaque External Agent bearer token.
 *
 * Layout: `nbos_agt_<keyId>_<secret>`
 * - `keyId` is a public lookup handle. It is indexed, safe to log and safe to
 *   display, and it is what lets verification avoid scanning every hash.
 * - `secret` is high-entropy and never persisted; only its argon2id verifier is.
 *
 * Both segments are hex encoded: the alphabet must exclude the separator, so
 * base64url (which emits `_`) cannot be used here.
 */
export const AGENT_TOKEN_PREFIX = 'nbos_agt';

const TOKEN_SEPARATOR = '_';
const KEY_ID_BYTES = 9;
const SECRET_BYTES = 32;
const DISPLAY_PREFIX_SECRET_CHARS = 4;
const EXPECTED_SEGMENT_COUNT = 4;
const HEX_CHARS_PER_BYTE = 2;
const KEY_ID_LENGTH = KEY_ID_BYTES * HEX_CHARS_PER_BYTE;
const SECRET_LENGTH = SECRET_BYTES * HEX_CHARS_PER_BYTE;
const KEY_ID_PATTERN = new RegExp(`^[0-9a-f]{${KEY_ID_LENGTH}}$`);
const SECRET_PATTERN = new RegExp(`^[0-9a-f]{${SECRET_LENGTH}}$`);

export interface GeneratedAgentToken {
  /** Full raw token. Returned to the admin exactly once, never stored. */
  token: string;
  keyId: string;
  secret: string;
  /** Safe display fragment, e.g. `nbos_agt_ab12cd34ef56_7h9k…`. */
  tokenPrefix: string;
}

export interface ParsedAgentToken {
  keyId: string;
  secret: string;
}

function encodeSegment(bytes: Buffer): string {
  return bytes.toString('hex');
}

export function buildAgentTokenPrefix(keyId: string, secret: string): string {
  const secretFragment = secret.slice(0, DISPLAY_PREFIX_SECRET_CHARS);
  return `${AGENT_TOKEN_PREFIX}${TOKEN_SEPARATOR}${keyId}${TOKEN_SEPARATOR}${secretFragment}`;
}

export function generateAgentToken(): GeneratedAgentToken {
  const keyId = encodeSegment(randomBytes(KEY_ID_BYTES));
  const secret = encodeSegment(randomBytes(SECRET_BYTES));
  return {
    token: `${AGENT_TOKEN_PREFIX}${TOKEN_SEPARATOR}${keyId}${TOKEN_SEPARATOR}${secret}`,
    keyId,
    secret,
    tokenPrefix: buildAgentTokenPrefix(keyId, secret),
  };
}

/**
 * Canonical parse. Anything that is not exactly a token this generator could
 * have produced — wrong namespace, wrong segment count, non-hex characters or
 * the wrong length — is rejected before any database lookup, which is how
 * employee JWTs, scheduler keys and oversized junk are turned away for free.
 */
export function parseAgentToken(rawToken: string): ParsedAgentToken | null {
  const trimmed = rawToken.trim();
  if (!trimmed) {
    return null;
  }
  const segments = trimmed.split(TOKEN_SEPARATOR);
  if (segments.length !== EXPECTED_SEGMENT_COUNT) {
    return null;
  }
  const [namespace, kind, keyId, secret] = segments;
  if (`${namespace}${TOKEN_SEPARATOR}${kind}` !== AGENT_TOKEN_PREFIX) {
    return null;
  }
  if (!keyId || !secret) {
    return null;
  }
  if (!KEY_ID_PATTERN.test(keyId) || !SECRET_PATTERN.test(secret)) {
    return null;
  }
  return { keyId, secret };
}

export function isAgentToken(rawToken: string): boolean {
  return parseAgentToken(rawToken) !== null;
}
