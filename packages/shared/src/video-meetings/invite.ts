/**
 * Invite token rules: store digest only; expiry and revoke are first-class.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Raw invite secret entropy (bytes) before base64url encoding. */
export const VIDEO_MEETING_INVITE_TOKEN_BYTES = 32 as const;

export type VideoMeetingInviteSnapshot = {
  tokenDigest: string;
  /** Forbidden on persisted rows — plaintext must never be stored. */
  tokenPlaintext?: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
};

/** Unpredictable invite secret for one-time return to the host (never persist). */
export function generateVideoMeetingInviteToken(
  bytes: number = VIDEO_MEETING_INVITE_TOKEN_BYTES,
): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex digest of the invite secret (persist this only). */
export function digestVideoMeetingInviteToken(tokenPlaintext: string): string {
  return createHash('sha256').update(tokenPlaintext, 'utf8').digest('hex');
}

/** Constant-time compare of a candidate secret against a stored digest. */
export function matchesVideoMeetingInviteDigest(
  tokenPlaintext: string,
  tokenDigest: string,
): boolean {
  const candidate = Buffer.from(digestVideoMeetingInviteToken(tokenPlaintext), 'utf8');
  const stored = Buffer.from(tokenDigest, 'utf8');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function inviteStoresDigestOnly(invite: VideoMeetingInviteSnapshot): boolean {
  if (invite.tokenPlaintext != null && invite.tokenPlaintext !== '') {
    return false;
  }
  return invite.tokenDigest.trim().length > 0;
}

export function isInviteRevoked(invite: Pick<VideoMeetingInviteSnapshot, 'revokedAt'>): boolean {
  return invite.revokedAt != null;
}

export function isInviteExpired(
  invite: Pick<VideoMeetingInviteSnapshot, 'expiresAt'>,
  now: Date = new Date(),
): boolean {
  return invite.expiresAt.getTime() <= now.getTime();
}

/** Usable for admission only when digest-backed, unrevoked, and unexpired. */
export function isInviteAdmissible(
  invite: VideoMeetingInviteSnapshot,
  now: Date = new Date(),
): boolean {
  if (!inviteStoresDigestOnly(invite)) return false;
  if (isInviteRevoked(invite)) return false;
  if (isInviteExpired(invite, now)) return false;
  return true;
}
