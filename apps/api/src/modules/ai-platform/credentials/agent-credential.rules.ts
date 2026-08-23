import { BadRequestException } from '@nestjs/common';
import {
  AGENT_CREDENTIAL_LABEL_MAX_LENGTH,
  AGENT_CREDENTIAL_MAX_OVERLAP_MS,
} from '../ai-platform.constants';

export function normalizeCredentialLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > AGENT_CREDENTIAL_LABEL_MAX_LENGTH) {
    throw new BadRequestException(`label exceeds ${AGENT_CREDENTIAL_LABEL_MAX_LENGTH} characters`);
  }
  return trimmed;
}

export interface OverlapWindowInput {
  requested: Date | null | undefined;
  /** The predecessor's current expiry, if it already has one. */
  currentExpiresAt: Date | null;
  now: Date;
}

/**
 * Validates a controlled-overlap window for a rotation.
 *
 * An overlap may only ever shorten the predecessor's life. Rotation is a
 * security operation, so it must not become a way to extend a credential that
 * was already scheduled to expire, and it must not open an unbounded window.
 *
 * Returns `null` when no overlap was requested, which means "revoke the
 * predecessor immediately".
 */
export function resolveOverlapWindow(input: OverlapWindowInput): Date | null {
  const { requested, currentExpiresAt, now } = input;
  if (requested === null || requested === undefined) {
    return null;
  }
  if (requested.getTime() <= now.getTime()) {
    throw new BadRequestException('previousValidUntil must be in the future');
  }
  if (requested.getTime() > now.getTime() + AGENT_CREDENTIAL_MAX_OVERLAP_MS) {
    throw new BadRequestException(
      `previousValidUntil exceeds the maximum overlap of ${AGENT_CREDENTIAL_MAX_OVERLAP_MS} ms`,
    );
  }
  if (currentExpiresAt !== null && requested.getTime() > currentExpiresAt.getTime()) {
    throw new BadRequestException('previousValidUntil cannot extend the existing expiry');
  }
  return requested;
}
