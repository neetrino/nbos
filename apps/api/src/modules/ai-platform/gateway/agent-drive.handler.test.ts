import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentDriveHandler } from './agent-drive.handler';

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

describe('AgentDriveHandler', () => {
  let policy: { assertAllowed: ReturnType<typeof vi.fn> };
  let access: { requireAuthorizedTask: ReturnType<typeof vi.fn> };
  let artifacts: {
    listLinkedTaskArtifacts: ReturnType<typeof vi.fn>;
    getLinkedTaskArtifact: ReturnType<typeof vi.fn>;
    getLinkedTaskArtifactView: ReturnType<typeof vi.fn>;
    createAndLinkTaskArtifact: ReturnType<typeof vi.fn>;
  };
  let handler: AgentDriveHandler;

  beforeEach(() => {
    policy = { assertAllowed: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }) };
    access = {
      requireAuthorizedTask: vi.fn().mockResolvedValue({
        task: { id: 'task-1' },
        workspace: { id: 'ws-a', productId: null, projectId: null },
      }),
    };
    artifacts = {
      listLinkedTaskArtifacts: vi.fn().mockResolvedValue([
        {
          id: 'file-ok',
          name: 'notes.md',
          mimeType: 'text/markdown',
          sizeBytes: 12,
          confidentiality: 'CONFIDENTIAL',
          dataClassification: 'INTERNAL',
          forbiddenToAgents: false,
        },
        {
          id: 'file-secret',
          name: 'vault.txt',
          mimeType: 'text/plain',
          sizeBytes: 4,
          confidentiality: 'SECRET_ADJACENT',
          dataClassification: 'SECRET',
          forbiddenToAgents: true,
        },
      ]),
      getLinkedTaskArtifact: vi.fn(),
      getLinkedTaskArtifactView: vi.fn(),
      createAndLinkTaskArtifact: vi
        .fn()
        .mockResolvedValue({ fileAssetId: 'file-new', linkId: 'link-1' }),
    };
    handler = new AgentDriveHandler(policy as never, access as never, artifacts as never);
  });

  it('omits SECRET_ADJACENT artifacts from the list', async () => {
    const listed = (await handler.readTaskArtifact(agent(), { taskId: 'task-1' })) as Array<{
      id: string;
    }>;
    expect(listed.map((item) => item.id)).toEqual(['file-ok']);
  });

  it('returns the same not-available error for a file linked to another task', async () => {
    artifacts.getLinkedTaskArtifact.mockRejectedValue(new NotFoundException('other task'));
    await expect(
      handler.readTaskArtifact(agent(), { taskId: 'task-1', fileAssetId: 'file-task-b' }),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });
    expect(artifacts.getLinkedTaskArtifact).toHaveBeenCalledWith('task-1', 'file-task-b');
    expect(artifacts.getLinkedTaskArtifactView).not.toHaveBeenCalled();
  });

  it.each(['FINANCE_SENSITIVE', 'LEGAL_SENSITIVE'] as const)(
    'returns not-available for a %s file by id',
    async (confidentiality) => {
      artifacts.getLinkedTaskArtifact.mockResolvedValue({
        id: 'file-sensitive',
        name: 'ledger.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 8,
        confidentiality,
        dataClassification: 'SENSITIVE',
        forbiddenToAgents: false,
      });
      await expect(
        handler.readTaskArtifact(agent(), { taskId: 'task-1', fileAssetId: 'file-sensitive' }),
      ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });
      expect(policy.assertAllowed).toHaveBeenCalledWith(
        expect.objectContaining({
          capabilityKey: 'drive.read_task_artifact',
          targetDataClassification: 'SENSITIVE',
        }),
      );
      expect(artifacts.getLinkedTaskArtifactView).not.toHaveBeenCalled();
    },
  );

  it('returns the same not-available error for a secret file and a missing file', async () => {
    artifacts.getLinkedTaskArtifact.mockResolvedValueOnce({
      id: 'file-secret',
      forbiddenToAgents: true,
      confidentiality: 'SECRET_ADJACENT',
      dataClassification: 'SECRET',
    });
    await expect(
      handler.readTaskArtifact(agent(), { taskId: 'task-1', fileAssetId: 'file-secret' }),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });

    artifacts.getLinkedTaskArtifact.mockRejectedValueOnce(new NotFoundException('missing'));
    await expect(
      handler.readTaskArtifact(agent(), { taskId: 'task-1', fileAssetId: 'other-task-file' }),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });
  });

  it('attaches through DriveTaskArtifactService, not Prisma', async () => {
    await handler.attachArtifact(
      agent(),
      { taskId: 'task-1', fileName: 'out.zip', mimeType: 'application/zip', sizeBytes: 4 },
      new Uint8Array([1, 2, 3, 4]),
      { operationKey: 'op-1', fingerprint: 'request-fp' },
    );
    expect(artifacts.createAndLinkTaskArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        fileName: 'out.zip',
        payloadFingerprint: 'request-fp',
        idempotencyKey: 'op-1',
      }),
    );
    expect(artifacts.createAndLinkTaskArtifact.mock.calls[0]?.[0]).not.toHaveProperty('checksum');
  });

  it('re-evaluates policy with the resolved file classification', async () => {
    artifacts.getLinkedTaskArtifact.mockResolvedValue({
      id: 'file-ok',
      name: 'notes.md',
      mimeType: 'text/markdown',
      sizeBytes: 12,
      confidentiality: 'CONFIDENTIAL',
      dataClassification: 'INTERNAL',
      forbiddenToAgents: false,
    });
    artifacts.getLinkedTaskArtifactView.mockResolvedValue({
      id: 'file-ok',
      name: 'notes.md',
      mimeType: 'text/markdown',
      sizeBytes: 12,
      confidentiality: 'CONFIDENTIAL',
      dataClassification: 'INTERNAL',
      forbiddenToAgents: false,
      viewUrl: 'https://signed.example/file',
    });

    await handler.readTaskArtifact(agent(), { taskId: 'task-1', fileAssetId: 'file-ok' });

    expect(policy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilityKey: 'drive.read_task_artifact',
        targetDataClassification: 'INTERNAL',
      }),
    );
  });
});
