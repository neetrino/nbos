import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = mockSend;
    constructor() {}
  }
  return {
    S3Client: MockS3Client,
    HeadObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

import { DriveUploadSessionService } from './drive-upload-session.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

const TEST_ORG_ID = '00000000-0000-4000-8000-000000000001';

function makeConfigMock() {
  return {
    get: (key: string) => (key === 'NBOS_TENANT_ORGANIZATION_ID' ? TEST_ORG_ID : undefined),
  };
}

function makeR2Mock() {
  return {
    ensureS3: () => ({ send: mockSend }) as never,
    bucket: 'test-bucket',
    publicUrl: 'https://cdn.example.com',
  };
}

function makeFolderMock() {
  return {
    placeFile: vi.fn(),
    assertCanUseFolder: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DriveUploadSessionService', () => {
  let service: DriveUploadSessionService;
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.project.findUnique.mockResolvedValue({
      code: 'P1',
      name: 'Site',
    });
    prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.task.findUnique.mockResolvedValue({ code: 'T1' });
    service = new DriveUploadSessionService(
      prisma as never,
      makeR2Mock() as never,
      makeFolderMock() as never,
      makeConfigMock() as never,
    );
  });

  it('lists library using SUPPORT context mapping', async () => {
    await service.listDriveLibrary('SUPPORT', 'ticket-1', {
      employeeId: 'user-1',
      departmentIds: [],
      driveScope: 'ALL',
    });

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          links: { some: { entityType: 'SUPPORT_TICKET', entityId: 'ticket-1', unlinkedAt: null } },
        }),
      }),
    );
  });

  it('lists library for DOCUMENT context', async () => {
    await service.listDriveLibrary('DOCUMENT', 'doc-uuid', {
      employeeId: 'user-1',
      departmentIds: [],
      driveScope: 'ALL',
    });

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          links: { some: { entityType: 'DOCUMENT', entityId: 'doc-uuid', unlinkedAt: null } },
        }),
      }),
    );
  });

  it('rejects missing library context without a 500', async () => {
    await expect(service.listDriveLibrary(undefined, 'doc-uuid')).rejects.toThrow(
      'Invalid library contextType',
    );
    await expect(service.listDriveLibrary('DOCUMENT', undefined)).rejects.toThrow(
      'contextId is required.',
    );
  });

  it('creates upload session with storage home key under nbos/tenants/', async () => {
    prisma.fileUploadSession.create.mockResolvedValue({
      id: 'sess-1',
      storageKey: `nbos/tenants/${TEST_ORG_ID}/files/projects/project-P1-site/_project/files/x.pdf`,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    const result = await service.createUploadSession(
      {
        fileName: 'doc.pdf',
        contentType: 'application/pdf',
        entityType: 'PROJECT',
        entityId: 'p1',
      },
      'user-1',
      { employeeId: 'user-1', departmentIds: [], driveScope: 'ALL' },
    );

    expect(result.uploadUrl).toBe('https://presigned-url.example.com');
    expect(result.storageKey).toMatch(new RegExp(`^nbos/tenants/${TEST_ORG_ID}/files/`));
    expect(prisma.fileUploadSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileAssetId: expect.any(String),
          storageKey: expect.stringMatching(/^nbos\/tenants\//),
        }),
      }),
    );
  });

  it('completes upload session after HeadObject succeeds', async () => {
    const future = new Date(Date.now() + 3_600_000);
    const sessionRow = {
      id: 'sess-1',
      status: 'PENDING',
      storageKey: `nbos/tenants/${TEST_ORG_ID}/files/tasks/task-T1/attachments/x.pdf`,
      fileAssetId: 'fa-pre',
      entityType: 'TASK',
      entityId: 't1',
      displayName: 'doc.pdf',
      originalName: 'doc.pdf',
      mimeType: 'application/pdf',
      purpose: null,
      sourceModule: null,
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
      linkType: 'TASK_ATTACHMENT',
      createdById: 'user-1',
      expiresAt: future,
      failedReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.fileUploadSession.findUnique.mockResolvedValue(sessionRow);
    mockSend.mockResolvedValueOnce({ ContentLength: 12 });

    prisma.fileAsset.create.mockResolvedValueOnce({
      id: 'fa-1',
      displayName: 'doc.pdf',
      versions: [],
      links: [],
    });

    prisma.task.findUnique.mockResolvedValue({
      creatorId: 'user-1',
      assigneeId: null,
      coAssignees: [],
      observers: [],
    });

    const out = await service.completeUploadSession(
      'sess-1',
      'user-1',
      { sizeBytes: 12 },
      { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
    );

    expect(out.id).toBe('fa-1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects upload session creation for inaccessible task context', async () => {
    prisma.task.findUnique.mockResolvedValue({
      creatorId: 'someone-else',
      assigneeId: null,
      coAssignees: [],
      observers: [],
    });

    await expect(
      service.createUploadSession(
        {
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          entityType: 'TASK',
          entityId: 'task-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('allows project upload session for scoped project participant', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          entityType: 'PROJECT',
          entityId: 'p1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'p1',
        }),
      }),
    );
  });

  it('rejects project upload session when user is outside project delivery and sales graph', async () => {
    prisma.project.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createUploadSession(
        {
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          entityType: 'PROJECT',
          entityId: 'p1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('rejects library listing when access scope is applied', async () => {
    await service.listDriveLibrary('SUPPORT', 'ticket-1', {
      employeeId: 'user-1',
      departmentIds: ['dep-1'],
      driveScope: 'OWN',
    });

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { ownerId: 'user-1' },
            { createdById: 'user-1' },
            expect.objectContaining({ assetGrants: expect.any(Object) }),
          ]),
        }),
      }),
    );
  });
});
