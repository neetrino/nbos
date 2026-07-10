import type { MetaMessagingUserProfile } from './meta-messaging-profile.types';

export type MetaLeadPlatform = 'INSTAGRAM' | 'FACEBOOK';

export const META_INSTAGRAM_FALLBACK_TITLE = 'Instagram user';
export const META_INSTAGRAM_FALLBACK_CONTACT = 'Instagram';
export const META_FACEBOOK_FALLBACK_TITLE = 'Facebook user';
export const META_FACEBOOK_FALLBACK_CONTACT = 'Facebook Messenger';

const INSTAGRAM_DM_PREFIX = 'Instagram DM';
const FACEBOOK_MESSENGER_PREFIX = 'Facebook Messenger';

export function formatInstagramUsername(username: string | null | undefined): string | null {
  const trimmed = username?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function buildInstagramLeadTitle(profile: MetaMessagingUserProfile): string {
  const displayName = profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const username = formatInstagramUsername(profile.username);
  if (username) {
    return username;
  }
  return META_INSTAGRAM_FALLBACK_TITLE;
}

export function buildInstagramLeadContactName(profile: MetaMessagingUserProfile): string {
  const username = formatInstagramUsername(profile.username);
  if (username) {
    return username;
  }
  const displayName = profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  return META_INSTAGRAM_FALLBACK_TITLE;
}

export function buildFacebookLeadTitle(profile: MetaMessagingUserProfile): string {
  const first = profile.firstName?.trim();
  const last = profile.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  const displayName = profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  return META_FACEBOOK_FALLBACK_TITLE;
}

export function buildFacebookLeadContactName(profile: MetaMessagingUserProfile): string {
  const displayName = profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const first = profile.firstName?.trim();
  const last = profile.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  return META_FACEBOOK_FALLBACK_TITLE;
}

export function buildMetaLeadNames(
  platform: MetaLeadPlatform,
  profile: MetaMessagingUserProfile,
): { name: string; contactName: string } {
  if (platform === 'INSTAGRAM') {
    return {
      name: buildInstagramLeadTitle(profile),
      contactName: buildInstagramLeadContactName(profile),
    };
  }
  return {
    name: buildFacebookLeadTitle(profile),
    contactName: buildFacebookLeadContactName(profile),
  };
}

export function isGenericMetaLeadField(
  value: string | null | undefined,
  platform: MetaLeadPlatform,
): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return true;
  }
  if (platform === 'INSTAGRAM') {
    return (
      trimmed === META_INSTAGRAM_FALLBACK_TITLE ||
      trimmed === META_INSTAGRAM_FALLBACK_CONTACT ||
      trimmed === 'Instagram user' ||
      trimmed === 'Instagram DM' ||
      trimmed.startsWith(`${INSTAGRAM_DM_PREFIX} — @`) ||
      trimmed.startsWith(`${INSTAGRAM_DM_PREFIX} - @`)
    );
  }
  return (
    trimmed === META_FACEBOOK_FALLBACK_TITLE ||
    trimmed === META_FACEBOOK_FALLBACK_CONTACT ||
    trimmed === 'Facebook user' ||
    trimmed === 'Facebook Messenger' ||
    trimmed.startsWith(`${FACEBOOK_MESSENGER_PREFIX} — `) ||
    trimmed.startsWith(`${FACEBOOK_MESSENGER_PREFIX} - `)
  );
}

export function profileToIdentityFields(profile: MetaMessagingUserProfile): {
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
} {
  return {
    displayName: profile.displayName?.trim() || null,
    username: profile.username?.trim() || null,
    firstName: profile.firstName?.trim() || null,
    lastName: profile.lastName?.trim() || null,
    profilePictureUrl: profile.profilePictureUrl?.trim() || null,
  };
}

export function identityToProfile(identity: {
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
}): MetaMessagingUserProfile {
  return {
    displayName: identity.displayName,
    username: identity.username,
    firstName: identity.firstName,
    lastName: identity.lastName,
    profilePictureUrl: identity.profilePictureUrl,
  };
}
