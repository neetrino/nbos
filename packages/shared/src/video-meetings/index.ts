export {
  VIDEO_MEETING_STATUSES,
  VIDEO_MEETING_RECORDING_STATUSES,
  VIDEO_MEETING_RECORDING_ASSET_STATUSES,
  isMeetingRecordingStatusPairValid,
  doesMeetingEndedImplyRecordingReady,
  isAssetStatusIndependentOfMeeting,
  canMarkRecordingReadyFromMeetingEndedAlone,
  isRecordingGroupReady,
} from './status';
export type {
  VideoMeetingStatusValue,
  VideoMeetingRecordingStatusValue,
  VideoMeetingRecordingAssetStatusValue,
} from './status';

export {
  VIDEO_MEETING_INVITE_TOKEN_BYTES,
  generateVideoMeetingInviteToken,
  digestVideoMeetingInviteToken,
  matchesVideoMeetingInviteDigest,
  inviteStoresDigestOnly,
  isInviteRevoked,
  isInviteExpired,
  isInviteAdmissible,
} from './invite';
export type { VideoMeetingInviteSnapshot } from './invite';

export {
  VIDEO_MEETING_CONSENT_DECISIONS,
  isConsentGranted,
  isRecordingEligibleFromConsents,
  deniesRecordingEligibility,
} from './consent';
export type { VideoMeetingConsentDecisionValue, VideoMeetingConsentSnapshot } from './consent';

export {
  hasVideoMeetingsPermission,
  callsPermissionGrantsVideoMeetings,
  entityLinkGrantsVideoMeetingsAccess,
  isVideoMeetingsViewDenied,
  VIDEO_MEETINGS_VIEW_KEY,
} from './permissions';
export type { PermissionMap, VideoMeetingEntityLinkRef } from './permissions';

export {
  DURATION_GUARD_CHECKPOINT_MS,
  DURATION_GUARD_WARNING_LEAD_MS,
  DURATION_GUARD_CENTER_LEAD_MS,
  durationGuardSnapshot,
} from './duration-guard';
export type { DurationGuardPhase, DurationGuardSnapshot } from './duration-guard';

export {
  VIDEO_MEETING_TOKEN_KIND_EMPLOYEE,
  VIDEO_MEETING_TOKEN_KIND_GUEST,
  videoMeetingTokenMetadata,
  readVideoMeetingTokenKind,
} from './participant-kind';
export type { VideoMeetingTokenKind } from './participant-kind';
