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
 * READY only when every asset is Drive-finalized READY; PARTIAL when some
 * READY and some FAILED/MISSING (no pending left).
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
  // Still waiting on objects / Drive finalize — not PARTIAL yet.
  if (pending > 0) {
    return VideoMeetingRecordingStatus.FINALIZING;
  }
  if (failed === assets.length) {
    return VideoMeetingRecordingStatus.FAILED;
  }
  if (ready > 0 && failed > 0) {
    return VideoMeetingRecordingStatus.PARTIAL;
  }
  return VideoMeetingRecordingStatus.PARTIAL;
}

/** True when HeadObject proves a non-empty object ready for Drive finalize. */
export function isNonEmptyObjectHead(head: {
  exists?: boolean;
  sizeBytes?: number;
  contentLength?: number | null;
}): boolean {
  if (typeof head.contentLength === 'number') {
    return head.contentLength > 0;
  }
  return Boolean(head.exists) && (head.sizeBytes ?? 0) > 0;
}
