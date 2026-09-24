/** Placeholder mailbox for a one-time link that does not name the person yet. */
export const OPEN_INVITE_EMAIL_SUFFIX = '@invite.nbos.invalid';

/** Open links join as Observer. The owner sets the real role after registration. */
export const OPEN_INVITE_ROLE_SLUG = 'observer';

export const INVITE_LINK_EXPIRY_DAYS = 7;

export function isOpenInviteEmail(email: string): boolean {
  return email.toLowerCase().endsWith(OPEN_INVITE_EMAIL_SUFFIX);
}

export function openInviteEmail(invitationId: string): string {
  return `open+${invitationId}${OPEN_INVITE_EMAIL_SUFFIX}`;
}

export function normalizeInviteEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function inviteExpiresAt(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_LINK_EXPIRY_DAYS);
  return expiresAt;
}

/** Accept page reads `token`. `invitationId` never resolves. */
export function buildAcceptInviteUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `${base}/accept-invite?token=${encodeURIComponent(token)}`;
}
