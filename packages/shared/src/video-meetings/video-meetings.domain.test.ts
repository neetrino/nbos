import { describe, expect, it } from 'vitest';
import {
  canMarkRecordingReadyFromMeetingEndedAlone,
  doesMeetingEndedImplyRecordingReady,
  isAssetStatusIndependentOfMeeting,
  isMeetingRecordingStatusPairValid,
  isRecordingGroupReady,
} from './status';
import {
  digestVideoMeetingInviteToken,
  generateVideoMeetingInviteToken,
  inviteStoresDigestOnly,
  isInviteAdmissible,
  isInviteExpired,
  isInviteRevoked,
  matchesVideoMeetingInviteDigest,
} from './invite';
import {
  deniesRecordingEligibility,
  isConsentGranted,
  isRecordingEligibleFromConsents,
} from './consent';
import {
  callsPermissionGrantsVideoMeetings,
  entityLinkGrantsVideoMeetingsAccess,
  hasVideoMeetingsPermission,
  isVideoMeetingsViewDenied,
} from './permissions';
import { CALLS_PLAY_PERMISSION, CALLS_VIEW_PERMISSION } from '../constants/calls-play';
import { VIDEO_MEETINGS_VIEW } from '../constants/video-meetings-permissions';
import {
  VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT,
  isVideoMeetingsFeatureEnabled,
} from '../constants/video-meetings-feature-flag';

describe('video meeting status invariants (ADR-VM-005)', () => {
  it('does not treat meeting ENDED as implying recording READY', () => {
    expect(doesMeetingEndedImplyRecordingReady()).toBe(false);
    expect(canMarkRecordingReadyFromMeetingEndedAlone()).toBe(false);
    expect(isMeetingRecordingStatusPairValid('ENDED', 'PENDING')).toBe(true);
    expect(isMeetingRecordingStatusPairValid('ENDED', 'FINALIZING')).toBe(true);
    expect(isMeetingRecordingStatusPairValid('ENDED', 'FAILED')).toBe(true);
    expect(isRecordingGroupReady('PENDING')).toBe(false);
  });

  it('keeps asset status independent of meeting status', () => {
    expect(isAssetStatusIndependentOfMeeting('ENDED', 'PENDING')).toBe(true);
    expect(isAssetStatusIndependentOfMeeting('ENDED', 'FAILED')).toBe(true);
    expect(isAssetStatusIndependentOfMeeting('ACTIVE', 'READY')).toBe(true);
    expect(isAssetStatusIndependentOfMeeting('CANCELLED', 'MISSING')).toBe(true);
  });
});

describe('video meeting invite digest rules', () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  it('requires digest and rejects plaintext storage', () => {
    expect(
      inviteStoresDigestOnly({
        tokenDigest: 'abc123digest',
        tokenPlaintext: null,
        expiresAt: future,
        revokedAt: null,
      }),
    ).toBe(true);
    expect(
      inviteStoresDigestOnly({
        tokenDigest: 'abc123digest',
        tokenPlaintext: 'secret-in-clear',
        expiresAt: future,
        revokedAt: null,
      }),
    ).toBe(false);
  });

  it('represents revoke and expiry', () => {
    const revoked = {
      tokenDigest: 'digest',
      expiresAt: future,
      revokedAt: new Date(),
    };
    const expired = {
      tokenDigest: 'digest',
      expiresAt: past,
      revokedAt: null,
    };
    expect(isInviteRevoked(revoked)).toBe(true);
    expect(isInviteExpired(expired)).toBe(true);
    expect(isInviteAdmissible({ ...revoked, tokenPlaintext: null })).toBe(false);
    expect(isInviteAdmissible({ ...expired, tokenPlaintext: null })).toBe(false);
    expect(
      isInviteAdmissible({
        tokenDigest: 'digest',
        tokenPlaintext: null,
        expiresAt: future,
        revokedAt: null,
      }),
    ).toBe(true);
  });

  it('generates unpredictable tokens and stable digests', () => {
    const a = generateVideoMeetingInviteToken();
    const b = generateVideoMeetingInviteToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
    const digest = digestVideoMeetingInviteToken(a);
    expect(digest).toHaveLength(64);
    expect(matchesVideoMeetingInviteDigest(a, digest)).toBe(true);
    expect(matchesVideoMeetingInviteDigest(b, digest)).toBe(false);
  });
});

describe('video meeting consent recording eligibility', () => {
  it('denies when consent is unknown or missing', () => {
    expect(isConsentGranted(null)).toBe(false);
    expect(isConsentGranted({ decision: 'UNKNOWN' })).toBe(false);
    expect(deniesRecordingEligibility(null)).toBe(true);
    expect(deniesRecordingEligibility({ decision: 'UNKNOWN' })).toBe(true);
    expect(isRecordingEligibleFromConsents([])).toBe(false);
    expect(isRecordingEligibleFromConsents([{ decision: 'UNKNOWN' }])).toBe(false);
    expect(
      isRecordingEligibleFromConsents([{ decision: 'GRANTED' }, { decision: 'UNKNOWN' }]),
    ).toBe(false);
  });

  it('allows only when every participant has GRANTED', () => {
    expect(
      isRecordingEligibleFromConsents([{ decision: 'GRANTED' }, { decision: 'GRANTED' }]),
    ).toBe(true);
    expect(
      isRecordingEligibleFromConsents([{ decision: 'GRANTED' }, { decision: 'REVOKED' }]),
    ).toBe(false);
    expect(
      isRecordingEligibleFromConsents([{ decision: 'GRANTED' }, { decision: 'DECLINED' }]),
    ).toBe(false);
  });
});

describe('video meetings permission negatives', () => {
  it('denies a principal without VIDEO_MEETINGS even when CALLS is granted', () => {
    const callsOnly = {
      [CALLS_VIEW_PERMISSION]: 'ALL',
      [CALLS_PLAY_PERMISSION]: 'ALL',
    };
    expect(hasVideoMeetingsPermission(callsOnly)).toBe(false);
    expect(isVideoMeetingsViewDenied(callsOnly)).toBe(true);
    expect(callsPermissionGrantsVideoMeetings(callsOnly)).toBe(false);
  });

  it('does not grant VIDEO_MEETINGS via entity links alone', () => {
    const noVm = { [CALLS_VIEW_PERMISSION]: 'OWN' };
    const links = [
      { entityType: 'DEAL' as const, entityId: 'deal-1' },
      { entityType: 'CONTACT' as const, entityId: 'contact-1' },
    ];
    expect(entityLinkGrantsVideoMeetingsAccess(links, noVm)).toBe(false);
    expect(entityLinkGrantsVideoMeetingsAccess(links, { [VIDEO_MEETINGS_VIEW]: 'ALL' })).toBe(true);
  });
});

describe('video meetings feature flag default', () => {
  it('defaults off and stays off for empty env', () => {
    expect(VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT).toBe(false);
    expect(isVideoMeetingsFeatureEnabled(undefined)).toBe(false);
    expect(isVideoMeetingsFeatureEnabled('')).toBe(false);
    expect(isVideoMeetingsFeatureEnabled('false')).toBe(false);
  });

  it('enables only for explicit truthy env', () => {
    expect(isVideoMeetingsFeatureEnabled('true')).toBe(true);
    expect(isVideoMeetingsFeatureEnabled('1')).toBe(true);
    expect(isVideoMeetingsFeatureEnabled('on')).toBe(true);
  });
});
