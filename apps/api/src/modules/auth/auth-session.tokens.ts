import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const REFRESH_SECRET_BYTES = 32;
const METADATA_HASH_BYTES = 32;

export type AccessTokenVersion = 1 | 2;

export interface V2AccessTokenClaims {
  sub: string;
  sid: string;
  typ: 'access';
  ver: 2;
  authVersion: number;
  /** Minimal claim retained for EmployeeGuard / legacy session display. */
  email: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Opaque refresh: `{sessionId}.{secret}`.
 * Only `secret` (or full token) is hashed for storage — never store raw.
 */
export function generateRefreshTokenPair(sessionId: string): {
  rawToken: string;
  secret: string;
} {
  const secret = randomBytes(REFRESH_SECRET_BYTES).toString('base64url');
  return { rawToken: `${sessionId}.${secret}`, secret };
}

export function parseRefreshToken(raw: string): { sessionId: string; secret: string } | null {
  const idx = raw.indexOf('.');
  if (idx <= 0 || idx === raw.length - 1) return null;
  const sessionId = raw.slice(0, idx);
  const secret = raw.slice(idx + 1);
  if (!sessionId || !secret) return null;
  return { sessionId, secret };
}

export function hashRefreshSecret(secret: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${secret}`, 'utf8').digest('hex');
}

export function refreshHashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Keyed hash for IP / UA metadata (never store raw). */
export function hashAuthMetadata(value: string, pepper: string): string {
  return createHash('sha256')
    .update(`${pepper}:meta:${value}`, 'utf8')
    .digest('hex')
    .slice(0, METADATA_HASH_BYTES);
}

export function isV2AccessPayload(payload: unknown): payload is V2AccessTokenClaims {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    p.typ === 'access' &&
    p.ver === 2 &&
    typeof p.sub === 'string' &&
    typeof p.sid === 'string' &&
    typeof p.authVersion === 'number'
  );
}

export function isLegacyAccessPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  if (p.ver === 2 || p.typ === 'access') return false;
  return typeof p.sub === 'string';
}
