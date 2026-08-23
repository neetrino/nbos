import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from './agent-capability.gateway';
import { AGENT_IDEMPOTENCY_TTL_MS } from './agent-capability.constants';
import { pickCapabilityInput, requireCapability } from './agent-capability.input';
import type { AgentCapabilityInvocation } from './agent-capability.types';
import { fingerprintCapabilityRequest } from './agent-idempotency.rules';
import { AgentIdempotencyService } from './agent-idempotency.service';

function agent(): AuthenticatedAgent {
  return {
    agentId: 'agent-1',
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    }),
  };
}

function attachInvocation(
  taskId: string,
  bytes: Uint8Array,
  operationKey = 'op-attach',
): AgentCapabilityInvocation {
  return {
    agent: agent(),
    capabilityKey: 'tasks.attach_artifact',
    input: {
      taskId,
      fileName: 'a.png',
      mimeType: 'image/png',
      sizeBytes: bytes.byteLength,
    },
    idempotencyKey: operationKey,
    payload: { bytes },
  };
}

function attachFingerprint(taskId: string, bytes: Uint8Array): string {
  const input = pickCapabilityInput(requireCapability('tasks.attach_artifact'), {
    taskId,
    fileName: 'a.png',
    mimeType: 'image/png',
    sizeBytes: bytes.byteLength,
  });
  return fingerprintCapabilityRequest(input, bytes);
}

describe('AgentCapabilityGateway attach recovery (F1)', () => {
  const originalBytes = new Uint8Array([1, 2, 3]);
  let drive: {
    attachArtifact: ReturnType<typeof vi.fn>;
    readTaskArtifact: ReturnType<typeof vi.fn>;
  };
  let prisma: ReturnType<typeof createMockPrisma>;
  let gateway: AgentCapabilityGateway;

  beforeEach(() => {
    drive = {
      readTaskArtifact: vi.fn(),
      attachArtifact: vi.fn().mockResolvedValue({ fileAssetId: 'file-1', linkId: 'link-1' }),
    };
    prisma = createMockPrisma();
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: attachFingerprint('task-1', originalBytes),
      status: 'IN_PROGRESS',
      responseJson: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    gateway = new AgentCapabilityGateway(
      prisma as never,
      { read: vi.fn() } as never,
      { list: vi.fn(), read: vi.fn(), readLinks: vi.fn(), readDiscussion: vi.fn() } as never,
      {
        create: vi.fn(),
        prepareCreate: vi.fn(),
        commitPreparedCreate: vi.fn(),
        update: vi.fn(),
        start: vi.fn(),
        comment: vi.fn(),
        submitReview: vi.fn(),
        reserveCreateCode: vi.fn(),
      } as never,
      drive as never,
      new AgentIdempotencyService(prisma as never),
      { assertStillAuthorized: vi.fn() } as never,
      { logMachineAction: vi.fn().mockResolvedValue(undefined) } as never,
    );
  });

  it('conflicts when a completed Drive attach is retried with different bytes', async () => {
    await expect(
      gateway.invoke(attachInvocation('task-1', new Uint8Array([9, 9, 9]))),
    ).rejects.toMatchObject({ code: 'AGENT_IDEMPOTENCY_CONFLICT' });
    expect(drive.attachArtifact).not.toHaveBeenCalled();
  });

  it('conflicts when the same key is reused against a different taskId', async () => {
    await expect(gateway.invoke(attachInvocation('task-b', originalBytes))).rejects.toMatchObject({
      code: 'AGENT_IDEMPOTENCY_CONFLICT',
    });
    expect(drive.attachArtifact).not.toHaveBeenCalled();
  });

  it('denies exact resume when the original task grant is revoked', async () => {
    drive.attachArtifact.mockRejectedValue(
      AgentAccessException.fromDenyReason('CAPABILITY_GRANT_REVOKED'),
    );
    await expect(gateway.invoke(attachInvocation('task-1', originalBytes))).rejects.toMatchObject({
      code: 'AGENT_CAPABILITY_DENIED',
    });
    expect(drive.attachArtifact).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ taskId: 'task-1' }),
      originalBytes,
      expect.objectContaining({ operationKey: 'op-attach' }),
    );
  });
});
