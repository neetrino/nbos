/**
 * Recording consent: unknown / missing / declined / revoked deny capture eligibility.
 */

export const VIDEO_MEETING_CONSENT_DECISIONS = [
  'UNKNOWN',
  'GRANTED',
  'DECLINED',
  'REVOKED',
] as const;

export type VideoMeetingConsentDecisionValue = (typeof VIDEO_MEETING_CONSENT_DECISIONS)[number];

export type VideoMeetingConsentSnapshot = {
  decision: VideoMeetingConsentDecisionValue;
} | null;

export function isConsentGranted(consent: VideoMeetingConsentSnapshot): boolean {
  return consent != null && consent.decision === 'GRANTED';
}

/**
 * Recording may start only when every capturable participant has affirmative GRANTED.
 * Missing row or UNKNOWN must deny — never guess (canon + ADR-VM-003).
 */
export function isRecordingEligibleFromConsents(
  consents: readonly VideoMeetingConsentSnapshot[],
): boolean {
  if (consents.length === 0) return false;
  return consents.every((consent) => isConsentGranted(consent));
}

export function deniesRecordingEligibility(consent: VideoMeetingConsentSnapshot): boolean {
  return !isConsentGranted(consent);
}
