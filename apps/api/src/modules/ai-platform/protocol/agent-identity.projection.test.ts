import { describe, expect, it } from 'vitest';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { toAgentIdentityProjection } from './agent-identity.projection';

describe('agent identity projection', () => {
  it('returns the authenticated actor identity', () => {
    const projection = toAgentIdentityProjection(authenticatedAgentFixture());

    expect(projection).toEqual({
      agentId: 'agent-1',
      agentName: 'Cursor Agent',
      actorType: 'EXTERNAL_AGENT',
      credentialKeyId: 'aabbccddeeff001122',
      channel: 'rest',
      correlationId: 'corr-1',
    });
  });

  it('never discloses capabilities, grants or scopes', () => {
    const projection = toAgentIdentityProjection(authenticatedAgentFixture());
    const serialized = JSON.stringify(projection).toLowerCase();

    expect(serialized).not.toContain('capabilit');
    expect(serialized).not.toContain('grant');
    expect(serialized).not.toContain('scope');
    expect(serialized).not.toContain('permission');
  });

  it('exposes the public key id but never the credential secret or its hash', () => {
    const projection = toAgentIdentityProjection(authenticatedAgentFixture());
    const serialized = JSON.stringify(projection).toLowerCase();

    expect(projection.credentialKeyId).toBe('aabbccddeeff001122');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('hash');
    expect(serialized).not.toContain('token');
  });

  it('reports the transport the credential was presented on', () => {
    const mcp = toAgentIdentityProjection(authenticatedAgentFixture({ channel: 'mcp' }));

    expect(mcp.channel).toBe('mcp');
  });
});
