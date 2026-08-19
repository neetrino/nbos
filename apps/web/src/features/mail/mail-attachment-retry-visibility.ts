/** Matches API `MAIL_ATTACHMENT_PENDING_STUCK_MS` — do not invent a fourth attachment status. */
export const MAIL_ATTACHMENT_PENDING_STUCK_MS = 3 * 60 * 1000;

export function isStuckPendingAttachment(
  downloadStatus: string,
  createdAt: string,
  nowMs: number,
): boolean {
  if (downloadStatus !== 'PENDING') {
    return false;
  }
  const createdMs = Date.parse(createdAt);
  if (Number.isNaN(createdMs)) {
    return true;
  }
  return nowMs - createdMs >= MAIL_ATTACHMENT_PENDING_STUCK_MS;
}

export function canRetryAttachmentDownload(params: {
  downloadStatus: string;
  createdAt: string;
  canEdit: boolean;
  nowMs: number;
}): boolean {
  if (!params.canEdit) {
    return false;
  }
  if (params.downloadStatus === 'FAILED') {
    return true;
  }
  return isStuckPendingAttachment(params.downloadStatus, params.createdAt, params.nowMs);
}

export function nextAttachmentRetryRevealAt(
  attachments: Array<{ downloadStatus: string; createdAt: string }>,
  nowMs: number,
): number | null {
  let soonest: number | null = null;
  for (const attachment of attachments) {
    if (attachment.downloadStatus !== 'PENDING') {
      continue;
    }
    const createdMs = Date.parse(attachment.createdAt);
    if (Number.isNaN(createdMs)) {
      continue;
    }
    const revealAt = createdMs + MAIL_ATTACHMENT_PENDING_STUCK_MS;
    if (revealAt <= nowMs) {
      continue;
    }
    if (soonest == null || revealAt < soonest) {
      soonest = revealAt;
    }
  }
  return soonest;
}
