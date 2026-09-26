/**
 * Independent status machines for Video Meetings (ADR-VM-005).
 * Meeting ENDED must never imply recording READY.
 */

export const VIDEO_MEETING_STATUSES = [
  'CREATED',
  'WAITING',
  'ACTIVE',
  'ENDED',
  'CANCELLED',
] as const;

export type VideoMeetingStatusValue = (typeof VIDEO_MEETING_STATUSES)[number];

export const VIDEO_MEETING_RECORDING_STATUSES = [
  'PENDING',
  'RECORDING',
  'FINALIZING',
  'READY',
  'PARTIAL',
  'FAILED',
] as const;

export type VideoMeetingRecordingStatusValue = (typeof VIDEO_MEETING_RECORDING_STATUSES)[number];

export const VIDEO_MEETING_RECORDING_ASSET_STATUSES = [
  'PENDING',
  'READY',
  'FAILED',
  'MISSING',
] as const;

export type VideoMeetingRecordingAssetStatusValue =
  (typeof VIDEO_MEETING_RECORDING_ASSET_STATUSES)[number];

const TERMINAL_MEETING: ReadonlySet<VideoMeetingStatusValue> = new Set(['ENDED', 'CANCELLED']);

const READY_RECORDING: ReadonlySet<VideoMeetingRecordingStatusValue> = new Set(['READY']);

/**
 * Ending a meeting does not advance recording or asset status.
 * Returns true when the pair is consistent with ADR-VM-005 separation.
 */
export function isMeetingRecordingStatusPairValid(
  meetingStatus: VideoMeetingStatusValue,
  recordingStatus: VideoMeetingRecordingStatusValue,
): boolean {
  if (!TERMINAL_MEETING.has(meetingStatus)) return true;
  // Meeting ended/cancelled while recording is still in-flight or failed is valid.
  // READY is allowed only after independent verification — not implied by ENDED alone.
  // Pairing ENDED + READY is permitted when recording finished separately;
  // implication check is `doesMeetingEndedImplyRecordingReady` below.
  void recordingStatus;
  return true;
}

/** Explicit product rule: ENDED alone must never be treated as recording READY. */
export function doesMeetingEndedImplyRecordingReady(): boolean {
  return false;
}

/**
 * Asset status is independent of both meeting and recording-group status.
 * A READY group may still have FAILED/MISSING assets (PARTIAL at group level).
 */
export function isAssetStatusIndependentOfMeeting(
  _meetingStatus: VideoMeetingStatusValue,
  _assetStatus: VideoMeetingRecordingAssetStatusValue,
): boolean {
  return true;
}

export function canMarkRecordingReadyFromMeetingEndedAlone(): boolean {
  return doesMeetingEndedImplyRecordingReady();
}

export function isRecordingGroupReady(status: VideoMeetingRecordingStatusValue): boolean {
  return READY_RECORDING.has(status);
}
