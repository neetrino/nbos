/**
 * Invite token rules: store digest only; expiry and revoke are first-class.
 */

export type VideoMeetingInviteSnapshot = {
  tokenDigest: string;
  /** Forbidden on persisted rows — plaintext must never be stored. */
  tokenPlaintext?: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
};

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
