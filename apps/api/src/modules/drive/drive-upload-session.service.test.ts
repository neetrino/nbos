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
    prisma.clientServiceRecord.findUnique.mockResolvedValue({ projectId: 'p1' });
    prisma.company.findUnique.mockResolvedValue({ id: 'comp-1', name: 'Acme' });
    prisma.company.findFirst.mockResolvedValue({ id: 'comp-1' });
    prisma.contact.findUnique.mockResolvedValue({ id: 'contact-1' });
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' });
    prisma.partner.findUnique.mockResolvedValue({ id: 'partner-1' });
    prisma.partner.findFirst.mockResolvedValue({ id: 'partner-1' });
    prisma.invoice.findUnique.mockResolvedValue({ projectId: 'p1' });
    prisma.payment.findUnique.mockResolvedValue({ invoice: { projectId: 'p1' } });
    prisma.expense.findUnique.mockResolvedValue({ projectId: 'p1', expensePlan: null });
    prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-1', name: 'Delivery' });
    prisma.workSpace.findFirst.mockResolvedValue({ id: 'ws-1' });
    prisma.task.findUnique.mockResolvedValue({ code: 'T1' });
    prisma.supportTicket.findUnique.mockResolvedValue({ id: 'ticket-1', assignedTo: 'user-1' });
    prisma.document.findUnique.mockResolvedValue({
      ownerId: 'user-1',
      createdById: 'user-1',
      listScopeOverride: null,
      section: { defaultListScope: 'ALL' },
    });
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
    await service.listDriveLibrary(
      'DOCUMENT',
      'doc-uuid',
      {
        employeeId: 'user-1',
        departmentIds: [],
        driveScope: 'ALL',
      },
      {
        employeeId: 'user-1',
        departmentIds: [],
        documentsViewScope: 'ALL',
      },
    );

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

  it('allows workspace upload session for scoped workspace participant graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          entityType: 'WORK_SPACE',
          entityId: 'ws-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');

    expect(prisma.workSpace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'ws-1',
        }),
      }),
    );
  });

  it('rejects workspace upload session when user is outside workspace delivery graph', async () => {
    prisma.workSpace.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createUploadSession(
        {
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          entityType: 'WORK_SPACE',
          entityId: 'ws-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('allows invoice upload session for scoped project participant', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'invoice.pdf',
          contentType: 'application/pdf',
          entityType: 'INVOICE',
          entityId: 'inv-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('rejects invoice upload session when underlying project graph is inaccessible', async () => {
    prisma.project.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createUploadSession(
        {
          fileName: 'invoice.pdf',
          contentType: 'application/pdf',
          entityType: 'INVOICE',
          entityId: 'inv-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('allows payment upload session through invoice project graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'payment.pdf',
          contentType: 'application/pdf',
          entityType: 'PAYMENT',
          entityId: 'pay-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('allows expense upload session through direct project graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'expense.pdf',
          contentType: 'application/pdf',
          entityType: 'EXPENSE',
          entityId: 'exp-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('rejects expense upload session without an accessible project anchor', async () => {
    prisma.expense.findUnique.mockResolvedValueOnce({
      projectId: null,
      expensePlan: { projectId: null },
    });

    await expect(
      service.createUploadSession(
        {
          fileName: 'expense.pdf',
          contentType: 'application/pdf',
          entityType: 'EXPENSE',
          entityId: 'exp-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('allows client service record upload session through project graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'service.pdf',
          contentType: 'application/pdf',
          entityType: 'CLIENT_SERVICE_RECORD',
          entityId: 'csr-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('allows company upload session through related project or deal graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'company.pdf',
          contentType: 'application/pdf',
          entityType: 'COMPANY',
          entityId: 'comp-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('rejects company upload session when company graph is inaccessible', async () => {
    prisma.company.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createUploadSession(
        {
          fileName: 'company.pdf',
          contentType: 'application/pdf',
          entityType: 'COMPANY',
          entityId: 'comp-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('allows contact upload session through related delivery graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'contact.pdf',
          contentType: 'application/pdf',
          entityType: 'CONTACT',
          entityId: 'contact-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('allows partner upload session through related partner business graph', async () => {
    await expect(
      service.createUploadSession(
        {
          fileName: 'partner.pdf',
          contentType: 'application/pdf',
          entityType: 'PARTNER',
          entityId: 'partner-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).resolves.toHaveProperty('uploadUrl');
  });

  it('rejects partner upload session when partner graph is inaccessible', async () => {
    prisma.partner.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createUploadSession(
        {
          fileName: 'partner.pdf',
          contentType: 'application/pdf',
          entityType: 'PARTNER',
          entityId: 'partner-1',
        },
        'user-1',
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('rejects library listing for inaccessible project context', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.project.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.listDriveLibrary('PROJECT', 'p1', {
        employeeId: 'user-1',
        departmentIds: [],
        driveScope: 'OWN',
      }),
    ).rejects.toThrow('Drive context not found');

    expect(prisma.fileAsset.findMany).not.toHaveBeenCalled();
  });

  it('rejects library listing when access scope is applied', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      assignedTo: 'user-1',
    });
    await service.listDriveLibrary('SUPPORT', 'ticket-1', {
      employeeId: 'user-1',
      departmentIds: ['dep-1'],
      driveScope: 'OWN',
    });

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { ownerId: 'user-1' },
                { createdById: 'user-1' },
                expect.objectContaining({
                  OR: expect.arrayContaining([
                    expect.objectContaining({ assetGrants: expect.any(Object) }),
                  ]),
                }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });
});
