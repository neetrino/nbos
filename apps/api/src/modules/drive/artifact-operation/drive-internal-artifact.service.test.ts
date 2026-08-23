import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveInternalArtifactService } from './drive-internal-artifact.service';

describe('DriveInternalArtifactService', () => {
  let attach: ReturnType<typeof vi.fn>;
  let service: DriveInternalArtifactService;

  beforeEach(() => {
    attach = vi.fn().mockResolvedValue({ fileAssetId: 'file-1', fileLinkId: 'link-1' });
    service = new DriveInternalArtifactService({
      createAndLinkTaskArtifact: attach,
    } as never);
  });

  it('uses the same Drive attach contract with INTERNAL_AI provenance', async () => {
    await service.attachTaskArtifact({
      agent: { id: 'ia-1', name: 'Helper', status: 'ACTIVE' },
      onBehalfOfEmployeeId: 'emp-9',
      taskId: 'task-1',
      fileName: 'out.md',
      mimeType: 'text/markdown',
      sizeBytes: 4,
      content: new Uint8Array([1, 2, 3, 4]),
      idempotencyKey: 'ia-op-1',
    });
    expect(attach).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'INTERNAL_AI',
        actorType: 'INTERNAL_AI',
        actorId: 'ia-1',
        agentId: 'ia-1',
        createdByEmployeeId: 'emp-9',
        taskId: 'task-1',
        idempotencyKey: 'ia-op-1',
      }),
    );
  });

  it('does not attach when the Internal Agent is disabled', async () => {
    attach.mockImplementation(
      async (input: { auth?: { assertCanFinalize: (ctx: object) => Promise<void> } }) => {
        await input.auth?.assertCanFinalize({
          source: 'INTERNAL_AI',
          actorId: 'ia-1',
          agentId: 'ia-1',
          entityType: 'TASK',
          entityId: 'task-1',
        });
        return { fileAssetId: 'file-1', fileLinkId: 'link-1' };
      },
    );
    service = new DriveInternalArtifactService({
      createAndLinkTaskArtifact: attach,
    } as never);
    await expect(
      service.attachTaskArtifact({
        agent: { id: 'ia-1', name: 'Helper', status: 'DISABLED' },
        taskId: 'task-1',
        fileName: 'out.md',
        mimeType: 'text/markdown',
        sizeBytes: 4,
        content: new Uint8Array([1, 2, 3, 4]),
        idempotencyKey: 'ia-op-2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
