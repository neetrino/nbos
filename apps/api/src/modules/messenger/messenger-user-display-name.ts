import type { CurrentUserPayload } from '../../common/decorators';

/** Visible sender label for in-memory MVP; replace with profile lookup when Messenger is persisted. */
export function messengerUserDisplayName(user: CurrentUserPayload): string {
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full.length > 0 ? full : user.email;
}
