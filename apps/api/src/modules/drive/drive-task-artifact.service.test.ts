import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { MAX_UPLOAD_BYTES } from './drive-upload-validation';
import { DRIVE_AGENT_SOURCE_MODULE, DriveTaskArtifactService } from './drive-task-artifact.service';

const TENANT_ID = '00000000-0000-4000-8000-000000000001';

describe('DriveTaskArtifactService', () => {
  let prisma: MockPrisma;
  let drive: {
    getAssetViewUrl: ReturnType<typeof vi.fn>;
  };
  let artifacts: {
    prepare: ReturnType<typeof vi.fn>;
    executeMachineUpload: ReturnType<typeof vi.fn>;
    fingerprintBytes: ReturnType<typeof vi.fn>;
  };
  let service: DriveTaskArtifactService;

  beforeEach(() => {
    prisma = createMockPrisma();
    drive = {
      getAssetViewUrl: vi.fn().mockResolvedValue({ url: 'https://signed.example/file' }),
    };
    artifacts = {
      prepare: vi.fn().mockResolvedValue({ id: 'op-1' }),
      executeMachineUpload: vi.fn().mockResolvedValue({
        fileAssetId: 'file-1',
        fileVersionId: 'ver-1',
        fileLinkId: 'link-1',
      }),
      fingerprintBytes: vi.fn().mockReturnValue('fp'),
    };
    const config = { get: vi.fn().mockReturnValue(TENANT_ID) };
    service = new DriveTaskArtifactService(
      prisma as never,
      drive as never,
      artifacts as never,
      config as never,
    );
  });

  it('creates the file through Drive with AI provenance and a task link', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const created = await service.createAndLinkTaskArtifact({
      taskId: 'task-1',
      fileName: 'notes.md',
      mimeType: 'text/markdown',
      sizeBytes: bytes.byteLength,
      content: bytes,
    });
    expect(created).toEqual({ fileAssetId: 'file-1', linkId: 'link-1' });
    expect(artifacts.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'EXTERNAL_AI',
        ingress: 'MACHINE_PUT',
        sourceModule: DRIVE_AGENT_SOURCE_MODULE,
        purpose: 'TASK_ATTACHMENT',
        entityType: 'TASK',
        entityId: 'task-1',
      }),
    );
    expect(artifacts.executeMachineUpload).toHaveBeenCalled();
    expect(prisma.fileAsset.create).not.toHaveBeenCalled();
    expect(prisma.fileLink.create).not.toHaveBeenCalled();
  });

  it('rejects executable file types using Drive upload policy', async () => {
    await expect(
      service.createAndLinkTaskArtifact({
        taskId: 'task-1',
        fileName: 'payload.exe',
        mimeType: 'application/octet-stream',
        sizeBytes: 4,
        content: new Uint8Array([1, 2, 3, 4]),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(artifacts.prepare).not.toHaveBeenCalled();
  });

  it('rejects a sizeBytes mismatch and oversized uploads', async () => {
    await expect(
      service.createAndLinkTaskArtifact({
        taskId: 'task-1',
        fileName: 'notes.md',
        mimeType: 'text/markdown',
        sizeBytes: 99,
        content: new Uint8Array([1, 2, 3, 4]),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createAndLinkTaskArtifact({
        taskId: 'task-1',
        fileName: 'notes.md',
        mimeType: 'text/markdown',
        sizeBytes: MAX_UPLOAD_BYTES + 1,
        content: new Uint8Array([1, 2, 3, 4]),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(artifacts.prepare).not.toHaveBeenCalled();
  });

  it('does not return a file linked to a different task', async () => {
    prisma.fileLink.findFirst.mockResolvedValue(null);
    await expect(service.getLinkedTaskArtifact('task-a', 'file-on-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.fileLink.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entityId: 'task-a', fileAssetId: 'file-on-b' }),
      }),
    );
  });

  it('hides SECRET_ADJACENT artifacts behind a not-found error', async () => {
    prisma.fileLink.findFirst.mockResolvedValue({
      fileAsset: {
        id: 'file-secret',
        displayName: 'vault.txt',
        mimeType: 'text/plain',
        sizeBytes: 4,
        confidentiality: 'SECRET_ADJACENT',
      },
    });
    await expect(service.getLinkedTaskArtifactView('task-1', 'file-secret')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(drive.getAssetViewUrl).not.toHaveBeenCalled();
  });
});
