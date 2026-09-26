import type { VideoMeetingRecordingAssetStatus, VideoMeetingRecordingStatus } from '@nbos/database';

export type VideoMeetingRecordingAssetDto = {
  id: string;
  kind: 'ROOM_COMPOSITE' | 'PARTICIPANT_AUDIO';
  status: VideoMeetingRecordingAssetStatus;
  participantId: string | null;
  rangeStartsAt: string | null;
  rangeEndsAt: string | null;
};

export type VideoMeetingRecordingGroupDto = {
  id: string;
  status: VideoMeetingRecordingStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  assets: VideoMeetingRecordingAssetDto[];
};

type AssetRow = {
  id: string;
  kind: 'ROOM_COMPOSITE' | 'PARTICIPANT_AUDIO';
  status: VideoMeetingRecordingAssetStatus;
  participantId: string | null;
  rangeStartsAt: Date | null;
  rangeEndsAt: Date | null;
  objectKey?: string | null;
  egressId?: string | null;
  fileAssetId?: string | null;
  livekitTrackId?: string | null;
};

type RecordingRow = {
  id: string;
  status: VideoMeetingRecordingStatus;
  startedAt: Date | null;
  stoppedAt: Date | null;
  assets: AssetRow[];
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Employee-safe recording summary: status + asset kind/status/participant id only.
 * Never includes object keys, signed URLs, egress ids, or fileAssetId.
 */
export function serializeRecordingGroup(recording: RecordingRow): VideoMeetingRecordingGroupDto {
  return {
    id: recording.id,
    status: recording.status,
    startedAt: toIso(recording.startedAt),
    stoppedAt: toIso(recording.stoppedAt),
    assets: recording.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      status: asset.status,
      participantId: asset.participantId,
      rangeStartsAt: toIso(asset.rangeStartsAt),
      rangeEndsAt: toIso(asset.rangeEndsAt),
    })),
  };
}

/** Guest-visible recording indicator — status only, no asset inventory. */
export function serializeGuestRecordingIndicator(
  recording: { status: VideoMeetingRecordingStatus } | null,
): { status: VideoMeetingRecordingStatus | 'NONE' } {
  if (!recording) return { status: 'NONE' };
  return { status: recording.status };
}
