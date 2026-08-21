import { describe, expect, it } from 'vitest';
import { AI_POLICY_DENY_REASONS } from './policy-decision';
import {
  AI_AGENT_ERROR_CODES,
  AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR,
  toAgentExternalError,
} from './policy-error-mapping';

describe('agent external error mapping', () => {
  it('maps every internal deny reason to a documented error code', () => {
    for (const reason of AI_POLICY_DENY_REASONS) {
      const error = toAgentExternalError(reason);
      expect(AI_AGENT_ERROR_CODES).toContain(error.code);
      expect(error.message.length).toBeGreaterThan(0);
      expect(error.status).toBeGreaterThanOrEqual(400);
    }
  });

  it('never leaks internal reason strings to clients', () => {
    for (const reason of AI_POLICY_DENY_REASONS) {
      expect(toAgentExternalError(reason).message).not.toContain(reason);
    }
  });

  it('makes an out-of-scope resource indistinguishable from a missing one', () => {
    const outOfScope = toAgentExternalError('RESOURCE_OUT_OF_SCOPE');
    expect(outOfScope).toEqual(AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR);
  });

  it('hides classification denials behind the same unavailable response', () => {
    expect(toAgentExternalError('DATA_CLASSIFICATION_FORBIDDEN')).toEqual(
      AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR,
    );
  });

  it('does not distinguish which capability was missing', () => {
    const notGranted = toAgentExternalError('CAPABILITY_NOT_GRANTED');
    const unknown = toAgentExternalError('CAPABILITY_UNKNOWN');
    const revokedGrant = toAgentExternalError('CAPABILITY_GRANT_REVOKED');
    expect(notGranted).toEqual(unknown);
    expect(notGranted).toEqual(revokedGrant);
  });

  it('keeps credential failures distinguishable for the caller itself', () => {
    expect(toAgentExternalError('CREDENTIAL_REVOKED').code).toBe('AGENT_CREDENTIAL_REVOKED');
    expect(toAgentExternalError('CREDENTIAL_EXPIRED').code).toBe('AGENT_CREDENTIAL_EXPIRED');
    expect(toAgentExternalError('CREDENTIAL_INVALID').code).toBe('AGENT_AUTH_INVALID');
  });

  it('reports rate limiting with 429', () => {
    expect(toAgentExternalError('RATE_LIMITED').status).toBe(429);
  });
});
