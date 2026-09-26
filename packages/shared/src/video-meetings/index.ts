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
