import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { hashAgentSecret } from '../credentials/agent-secret-hash';
import { generateAgentToken, type GeneratedAgentToken } from '../credentials/agent-token';
import { AgentAuthenticatorService } from './agent-authenticator.service';
import { AgentAccessException } from './agent-auth.errors';

const PAST = new Date('2020-01-01T00:00:00.000Z');
const FUTURE = new Date('2099-01-01T00:00:00.000Z');

interface CredentialOverrides {
  revokedAt?: Date | null;
  expiresAt?: Date | null;
  agentStatus?: string;
  agentExpiresAt?: Date | null;
  agentRevokedAt?: Date | null;
}

describe('AgentAuthenticatorService', () => {
  let prisma: MockPrisma;
  let service: AgentAuthenticatorService;
  let token: GeneratedAgentToken;

  async function stubCredential(overrides: CredentialOverrides = {}): Promise<void> {
    prisma.externalAgentCredential.findUnique.mockResolvedValue({
      id: 'cred-1',
      agentId: 'agent-1',
      keyId: token.keyId,
      secretHash: await hashAgentSecret(token.secret),
      revokedAt: overrides.revokedAt ?? null,
      expiresAt: overrides.expiresAt ?? null,
      agent: {
        id: 'agent-1',
        name: 'Cursor Agent',
        status: overrides.agentStatus ?? 'ACTIVE',
        expiresAt: overrides.agentExpiresAt ?? null,
        revokedAt: overrides.agentRevokedAt ?? null,
      },
    });
  }

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AgentAuthenticatorService(prisma as never);
    token = generateAgentToken();
  });

  it('authenticates a valid credential into an EXTERNAL_AGENT actor', async () => {
    await stubCredential({ expiresAt: FUTURE });

    const authenticated = await service.authenticate(token.token, {
      channel: 'rest',
      ipAddress: '203.0.113.4',
      userAgent: 'cursor/1.0',
      correlationId: 'corr-1',
    });

    expect(authenticated.agentId).toBe('agent-1');
    expect(authenticated.actor.actor).toEqual({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    });
    expect(authenticated.actor.channel).toEqual({ source: 'rest', protocol: null });
  });

  it('carries only the public key id as client metadata, never the secret', async () => {
    await stubCredential();

    const authenticated = await service.authenticate(token.token, { channel: 'mcp' });

    expect(authenticated.actor.client?.credentialId).toBe(token.keyId);
    expect(JSON.stringify(authenticated.actor)).not.toContain(token.secret);
  });

  describe('token shape', () => {
    it.each([
      ['random text', 'not-a-token'],
      ['employee JWT', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbXAtMSIsInR5cCI6ImFjY2VzcyJ9.signature'],
      ['right shape, non-hex segments', 'nbos_agt_ZZZZZZZZZZZZZZZZZZ_' + 'Z'.repeat(64)],
      ['short key id', 'nbos_agt_abcdef_' + 'a'.repeat(64)],
      ['short secret', `nbos_agt_${'a'.repeat(18)}_abcdef`],
      ['oversized secret', `nbos_agt_${'a'.repeat(18)}_${'a'.repeat(4096)}`],
      ['uppercase hex', `nbos_agt_${'A'.repeat(18)}_${'A'.repeat(64)}`],
    ])('rejects %s without touching the database', async (_label, value) => {
      await expect(service.authenticate(value, { channel: 'rest' })).rejects.toThrow(
        AgentAccessException,
      );
      expect(prisma.externalAgentCredential.findUnique).not.toHaveBeenCalled();
    });
  });

  it('rejects an unknown key id', async () => {
    prisma.externalAgentCredential.findUnique.mockResolvedValue(null);
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_AUTH_INVALID',
    });
  });

  it('answers an unknown key id and a wrong secret identically', async () => {
    prisma.externalAgentCredential.findUnique.mockResolvedValue(null);
    const unknownKey = await service
      .authenticate(token.token, { channel: 'rest' })
      .catch((error: AgentAccessException) => error);

    const other = generateAgentToken();
    prisma.externalAgentCredential.findUnique.mockResolvedValue({
      id: 'cred-1',
      agentId: 'agent-1',
      keyId: token.keyId,
      secretHash: await hashAgentSecret(other.secret),
      revokedAt: null,
      expiresAt: null,
      agent: {
        id: 'agent-1',
        name: 'Cursor Agent',
        status: 'ACTIVE',
        expiresAt: null,
        revokedAt: null,
      },
    });
    const wrongSecret = await service
      .authenticate(token.token, { channel: 'rest' })
      .catch((error: AgentAccessException) => error);

    expect(unknownKey).toBeInstanceOf(AgentAccessException);
    expect(wrongSecret).toBeInstanceOf(AgentAccessException);
    expect((unknownKey as AgentAccessException).code).toBe(
      (wrongSecret as AgentAccessException).code,
    );
    expect((unknownKey as AgentAccessException).getResponse()).toEqual(
      (wrongSecret as AgentAccessException).getResponse(),
    );
  });

  it('rejects a revoked credential', async () => {
    await stubCredential({ revokedAt: PAST });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_CREDENTIAL_REVOKED',
    });
  });

  it('rejects an expired credential', async () => {
    await stubCredential({ expiresAt: PAST });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_CREDENTIAL_EXPIRED',
    });
  });

  it('rejects a disabled agent even with a valid credential', async () => {
    await stubCredential({ agentStatus: 'DISABLED' });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
  });

  it('rejects a revoked agent even with a valid credential', async () => {
    await stubCredential({ agentStatus: 'REVOKED', agentRevokedAt: PAST });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
  });

  it('rejects an agent revoked behind an ACTIVE status column', async () => {
    await stubCredential({ agentStatus: 'ACTIVE', agentRevokedAt: PAST });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
  });

  it('rejects an expired agent even with a live credential', async () => {
    await stubCredential({ agentExpiresAt: PAST, expiresAt: FUTURE });
    await expect(service.authenticate(token.token, { channel: 'rest' })).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
  });

  it('still authenticates when usage telemetry fails', async () => {
    await stubCredential();
    prisma.$transaction.mockRejectedValueOnce(new Error('db unavailable'));

    const authenticated = await service.authenticate(token.token, { channel: 'rest' });
    expect(authenticated.agentId).toBe('agent-1');
  });
});
