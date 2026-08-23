import { describe, expect, it } from 'vitest';
import {
  canEnableExternalAgent,
  canExtendExternalAgentExpiry,
  canGrantExternalAgentAccess,
  canIssueExternalAgentToken,
  canRotateAgentCredential,
  isExternalAgentRevoked,
} from './external-agent-actions';

describe('External Agent UI actions', () => {
  it('does not offer enable or issue after revoke', () => {
    expect(isExternalAgentRevoked('REVOKED')).toBe(true);
    expect(canEnableExternalAgent('REVOKED')).toBe(false);
    expect(canIssueExternalAgentToken('REVOKED')).toBe(false);
    expect(canGrantExternalAgentAccess('REVOKED')).toBe(false);
  });

  it('allows re-enable only from DISABLED', () => {
    expect(canEnableExternalAgent('DISABLED')).toBe(true);
    expect(canEnableExternalAgent('ACTIVE')).toBe(false);
  });

  it('blocks issue and grant on EXPIRED until expiry is extended', () => {
    expect(canIssueExternalAgentToken('EXPIRED')).toBe(false);
    expect(canGrantExternalAgentAccess('EXPIRED')).toBe(false);
    expect(canExtendExternalAgentExpiry('EXPIRED')).toBe(true);
  });

  it('does not offer enable, issue, grant or rotate for a disabled-but-expired projection', () => {
    expect(canEnableExternalAgent('EXPIRED')).toBe(false);
    expect(canIssueExternalAgentToken('EXPIRED')).toBe(false);
    expect(canGrantExternalAgentAccess('EXPIRED')).toBe(false);
    expect(canRotateAgentCredential('EXPIRED', 'ACTIVE')).toBe(false);
    expect(canExtendExternalAgentExpiry('EXPIRED')).toBe(true);
  });

  it('allows recovery rotation for an expired credential on a live agent', () => {
    expect(canRotateAgentCredential('ACTIVE', 'EXPIRED')).toBe(true);
    expect(canRotateAgentCredential('EXPIRED', 'EXPIRED')).toBe(false);
    expect(canRotateAgentCredential('ACTIVE', 'REVOKED')).toBe(false);
  });
});
