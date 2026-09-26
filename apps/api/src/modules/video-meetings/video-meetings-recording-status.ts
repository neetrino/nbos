import {
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
  type VideoMeetingRecordingAssetStatus as AssetStatus,
  type VideoMeetingRecordingStatus as GroupStatus,
} from '@nbos/database';
import { canMarkRecordingReadyFromMeetingEndedAlone } from '@nbos/shared';

/**
 * Derive group status after independent asset verification (ADR-VM-005).
 * Meeting ENDED alone never forces READY.
 */
export function deriveRecordingGroupStatus(
  assets: ReadonlyArray<{ status: AssetStatus }>,
  options?: { meetingEnded?: boolean },
): GroupStatus {
  if (options?.meetingEnded && canMarkRecordingReadyFromMeetingEndedAlone()) {
    // Shared helper is always false; kept for ADR fidelity in call sites.
  }

  if (assets.length === 0) {
    return VideoMeetingRecordingStatus.FAILED;
  }

  const ready = assets.filter((a) => a.status === VideoMeetingRecordingAssetStatus.READY).length;
  const failed = assets.filter(
    (a) =>
      a.status === VideoMeetingRecordingAssetStatus.FAILED ||
      a.status === VideoMeetingRecordingAssetStatus.MISSING,
  ).length;
  const pending = assets.filter(
    (a) => a.status === VideoMeetingRecordingAssetStatus.PENDING,
  ).length;

  if (ready === assets.length) {
    return VideoMeetingRecordingStatus.READY;
  }
  if (ready > 0 && (failed > 0 || pending > 0)) {
    return VideoMeetingRecordingStatus.PARTIAL;
  }
  if (failed === assets.length) {
    return VideoMeetingRecordingStatus.FAILED;
  }
  if (pending > 0) {
    return VideoMeetingRecordingStatus.FINALIZING;
  }
  return VideoMeetingRecordingStatus.PARTIAL;
}

/** Mark READY only when object exists with non-zero size. */
export function assetStatusFromObjectHead(head: {
  exists: boolean;
  sizeBytes: number;
}): AssetStatus {
  if (head.exists && head.sizeBytes > 0) {
    return VideoMeetingRecordingAssetStatus.READY;
  }
  if (!head.exists) {
    return VideoMeetingRecordingAssetStatus.PENDING;
  }
  return VideoMeetingRecordingAssetStatus.FAILED;
}
