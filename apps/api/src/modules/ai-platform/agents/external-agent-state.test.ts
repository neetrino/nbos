import { describe, expect, it } from 'vitest';
import { toExternalAgentView } from './external-agent.mapper';
import {
  isAgentUsable,
  isGrantActive,
  isTimestampPast,
  resolveAgentState,
  resolveCredentialState,
  resolveGrantState,
} from './external-agent-state';

const NOW = new Date('2026-08-21T12:00:00.000Z');
const PAST = new Date('2026-08-20T12:00:00.000Z');
const FUTURE = new Date('2026-08-22T12:00:00.000Z');

describe('resolveAgentState', () => {
  it('reports ACTIVE for an active agent without expiry', () => {
    expect(resolveAgentState({ status: 'ACTIVE', expiresAt: null, revokedAt: null }, NOW)).toBe(
      'ACTIVE',
    );
    expect(isAgentUsable({ status: 'ACTIVE', expiresAt: FUTURE, revokedAt: null }, NOW)).toBe(true);
  });

  it('treats an elapsed expiry as EXPIRED without waiting for a sweeper', () => {
    expect(resolveAgentState({ status: 'ACTIVE', expiresAt: PAST, revokedAt: null }, NOW)).toBe(
      'EXPIRED',
    );
    expect(isAgentUsable({ status: 'ACTIVE', expiresAt: PAST, revokedAt: null }, NOW)).toBe(false);
  });

  it('keeps revoke ahead of expiry and treats disabled-but-elapsed as EXPIRED', () => {
    expect(resolveAgentState({ status: 'REVOKED', expiresAt: PAST, revokedAt: PAST }, NOW)).toBe(
      'REVOKED',
    );
    expect(resolveAgentState({ status: 'DISABLED', expiresAt: PAST, revokedAt: null }, NOW)).toBe(
      'EXPIRED',
    );
    expect(resolveAgentState({ status: 'DISABLED', expiresAt: FUTURE, revokedAt: null }, NOW)).toBe(
      'DISABLED',
    );
    expect(resolveAgentState({ status: 'EXPIRED', expiresAt: null, revokedAt: null }, NOW)).toBe(
      'EXPIRED',
    );
  });

  it('treats revocation as terminal even if the status column says otherwise', () => {
    expect(resolveAgentState({ status: 'ACTIVE', expiresAt: null, revokedAt: PAST }, NOW)).toBe(
      'REVOKED',
    );
    expect(resolveAgentState({ status: 'DISABLED', expiresAt: null, revokedAt: PAST }, NOW)).toBe(
      'REVOKED',
    );
    expect(isAgentUsable({ status: 'ACTIVE', expiresAt: FUTURE, revokedAt: PAST }, NOW)).toBe(
      false,
    );
  });

  it('projects a DISABLED admin row with elapsed expiry as EXPIRED', () => {
    expect(
      toExternalAgentView(
        {
          id: 'a1',
          name: 'Off',
          description: null,
          status: 'DISABLED',
          ownerId: 'owner',
          createdById: 'owner',
          expiresAt: PAST,
          revokedAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          lastUsedChannel: null,
          createdAt: NOW,
          updatedAt: NOW,
        },
        NOW,
      ).state,
    ).toBe('EXPIRED');
  });

  it('treats an expiry exactly at now as elapsed', () => {
    expect(resolveAgentState({ status: 'ACTIVE', expiresAt: NOW, revokedAt: null }, NOW)).toBe(
      'EXPIRED',
    );
  });
});

describe('resolveCredentialState', () => {
  it('reports ACTIVE for a live credential', () => {
    expect(resolveCredentialState({ revokedAt: null, expiresAt: FUTURE }, NOW)).toBe('ACTIVE');
    expect(resolveCredentialState({ revokedAt: null, expiresAt: null }, NOW)).toBe('ACTIVE');
  });

  it('prefers REVOKED over EXPIRED', () => {
    expect(resolveCredentialState({ revokedAt: PAST, expiresAt: PAST }, NOW)).toBe('REVOKED');
  });

  it('reports EXPIRED once the window elapses', () => {
    expect(resolveCredentialState({ revokedAt: null, expiresAt: PAST }, NOW)).toBe('EXPIRED');
  });
});

describe('grant state', () => {
  it('marks revoked and expired grants', () => {
    expect(
      resolveGrantState({ capabilityKey: 'tasks.read', revokedAt: PAST, expiresAt: null }, NOW),
    ).toEqual({ capabilityKey: 'tasks.read', revoked: true, expired: false });
    expect(
      resolveGrantState({ capabilityKey: 'tasks.read', revokedAt: null, expiresAt: PAST }, NOW),
    ).toEqual({ capabilityKey: 'tasks.read', revoked: false, expired: true });
  });

  it('treats a live grant as active', () => {
    expect(
      isGrantActive({ capabilityKey: 'tasks.read', revokedAt: null, expiresAt: FUTURE }, NOW),
    ).toBe(true);
    expect(
      isGrantActive({ capabilityKey: 'tasks.read', revokedAt: PAST, expiresAt: FUTURE }, NOW),
    ).toBe(false);
  });
});

describe('isTimestampPast', () => {
  it('handles null and future timestamps', () => {
    expect(isTimestampPast(null, NOW)).toBe(false);
    expect(isTimestampPast(FUTURE, NOW)).toBe(false);
    expect(isTimestampPast(PAST, NOW)).toBe(true);
  });
});
