import { describe, expect, it } from 'vitest';
import {
  MAIL_ATTACHMENT_PENDING_STUCK_MS,
  canRetryAttachmentDownload,
  nextAttachmentRetryRevealAt,
} from './mail-attachment-retry-visibility';

const NOW_MS = Date.parse('2026-08-19T12:00:00.000Z');

function createdAt(offsetMs: number): string {
  return new Date(NOW_MS + offsetMs).toISOString();
}

describe('canRetryAttachmentDownload', () => {
  it('shows Retry for Failed when the user can edit', () => {
    expect(
      canRetryAttachmentDownload({
        downloadStatus: 'FAILED',
        createdAt: createdAt(0),
        canEdit: true,
        nowMs: NOW_MS,
      }),
    ).toBe(true);
  });

  it('hides Retry for fresh Pending while download may still be in flight', () => {
    expect(
      canRetryAttachmentDownload({
        downloadStatus: 'PENDING',
        createdAt: createdAt(-60_000),
        canEdit: true,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });

  it('shows Retry for stuck Pending after the timeout', () => {
    expect(
      canRetryAttachmentDownload({
        downloadStatus: 'PENDING',
        createdAt: createdAt(-MAIL_ATTACHMENT_PENDING_STUCK_MS),
        canEdit: true,
        nowMs: NOW_MS,
      }),
    ).toBe(true);
  });

  it('hides Retry without MAIL EDIT and for Ready', () => {
    expect(
      canRetryAttachmentDownload({
        downloadStatus: 'FAILED',
        createdAt: createdAt(-MAIL_ATTACHMENT_PENDING_STUCK_MS),
        canEdit: false,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
    expect(
      canRetryAttachmentDownload({
        downloadStatus: 'READY',
        createdAt: createdAt(-MAIL_ATTACHMENT_PENDING_STUCK_MS),
        canEdit: true,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });
});

describe('nextAttachmentRetryRevealAt', () => {
  it('returns the soonest Pending reveal time', () => {
    const revealAt = nextAttachmentRetryRevealAt(
      [
        { downloadStatus: 'PENDING', createdAt: createdAt(-60_000) },
        { downloadStatus: 'FAILED', createdAt: createdAt(-10_000) },
      ],
      NOW_MS,
    );
    expect(revealAt).toBe(NOW_MS - 60_000 + MAIL_ATTACHMENT_PENDING_STUCK_MS);
  });

  it('returns null when nothing is waiting to become stuck', () => {
    expect(
      nextAttachmentRetryRevealAt(
        [{ downloadStatus: 'PENDING', createdAt: createdAt(-MAIL_ATTACHMENT_PENDING_STUCK_MS) }],
        NOW_MS,
      ),
    ).toBeNull();
  });
});
