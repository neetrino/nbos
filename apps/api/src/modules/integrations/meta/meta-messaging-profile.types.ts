/** Normalized sender profile for Instagram and Facebook messaging. */
export type MetaMessagingUserProfile = {
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
};

export type MetaProfileLookupResult =
  | { ok: true; profile: MetaMessagingUserProfile }
  | { ok: false; errorCode: string; errorMessage: string };

export const META_PROFILE_FETCH_STATUS_OK = 'OK' as const;
export const META_PROFILE_FETCH_STATUS_FAILED = 'FAILED' as const;
export const META_PROFILE_FETCH_STATUS_SKIPPED = 'SKIPPED' as const;

export type MetaProfileFetchStatus =
  | typeof META_PROFILE_FETCH_STATUS_OK
  | typeof META_PROFILE_FETCH_STATUS_FAILED
  | typeof META_PROFILE_FETCH_STATUS_SKIPPED;
