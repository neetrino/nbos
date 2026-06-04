import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = mockSend;
    constructor() {}
  }
  return {
    S3Client: MockS3Client,
    ListObjectsV2Command: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

import { DriveService } from './drive.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

function makeR2Mock() {
  return {
    ensureS3: () => ({ send: mockSend }) as never,
    bucket: 'test-bucket',
    publicUrl: 'https://cdn.example.com',
  };
}

function makeUnavailableR2() {
  return {
    ensureS3: () => {
      throw new NotFoundException('Drive (R2) is not configured');
    },
    bucket: '',
    publicUrl: '',
  };
}

function makeNotificationsMock() {
  return { create: vi.fn().mockResolvedValue({ id: 'n1' }) };
}

function policyFileRow(
  overrides: Partial<{
    id: string;
    ownerId: string | null;
    createdById: string | null;
    visibility: string;
    confidentiality: string;
    status: string;
  }> = {},
) {
  return {
    id: 'f1',
    ownerId: 'emp-1',
    createdById: 'emp-1',
    visibility: 'INTERNAL',
    confidentiality: 'CONFIDENTIAL',
    status: 'ACTIVE',
    ...overrides,
  };
}

function makeProjectHubMock() {
  return {
    getSummary: vi.fn(),
    buildProjectLevelWhere: vi.fn().mockResolvedValue({}),
  };
}

function makeConfigMock() {
  return {
    get: (key: string) =>
      key === 'NBOS_TENANT_ORGANIZATION_ID' ? '00000000-0000-4000-8000-000000000001' : undefined,
  };
}

describe('DriveService', () => {
  describe('with R2 configured', () => {
    let service: DriveService;
    let prisma: MockPrisma;

    beforeEach(() => {
      vi.clearAllMocks();
      prisma = createMockPrisma();
      service = new DriveService(
        prisma as never,
        makeR2Mock() as never,
        makeNotificationsMock() as never,
        makeProjectHubMock() as never,
        makeConfigMock() as never,
      );
    });

    it('should list files from R2 (under Drive/ prefix)', async () => {
      mockSend.mockResolvedValueOnce({
        CommonPrefixes: [{ Prefix: 'Drive/projects/p1/docs/' }],
        Contents: [{ Key: 'Drive/projects/p1/readme.txt', Size: 1024, LastModified: new Date() }],
      });

      const files = await service.listFiles('p1');

      expect(files.length).toBe(2);
      expect(files[0]!.isFolder).toBe(true);
      expect(files[0]!.name).toBe('docs');
      expect(files[1]!.name).toBe('readme.txt');
    });

    it('should generate upload URL (key under Drive/)', async () => {
      const result = await service.getUploadUrl('p1', 'test.pdf', 'application/pdf');

      expect(result.uploadUrl).toBe('https://presigned-url.example.com');
      expect(result.key).toBe('Drive/projects/p1/test.pdf');
      expect(result.publicUrl).toBe('https://cdn.example.com/Drive/projects/p1/test.pdf');
    });

    it('should generate download URL', async () => {
      const result = await service.getDownloadUrl('p1', 'docs/file.pdf');

      expect(result.downloadUrl).toBe('https://presigned-url.example.com');
    });

    it('should delete a file', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(service.deleteFile('p1', 'test.pdf')).resolves.toBeUndefined();
    });

    it('should build project structure tree (keys under Drive/)', async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'Drive/projects/p1/docs/readme.md', Size: 512, LastModified: new Date() },
          { Key: 'Drive/projects/p1/src/index.ts', Size: 256, LastModified: new Date() },
        ],
      });

      const tree = await service.getProjectStructure('p1');

      expect(tree.name).toBe('p1');
      expect(tree.children.length).toBe(2);
    });

    it('should resolve keys with or without prefix', async () => {
      const result1 = await service.getDownloadUrl('p1', 'file.txt');
      expect(result1.downloadUrl).toBe('https://presigned-url.example.com');

      const result2 = await service.getDownloadUrl('p1', 'projects/p1/file.txt');
      expect(result2.downloadUrl).toBe('https://presigned-url.example.com');
    });

    it('returns presigned view url for R2 file asset', async () => {
      prisma.fileAsset.findFirst.mockResolvedValueOnce({
        id: 'f1',
        deletedAt: null,
        status: 'ACTIVE',
        storageProvider: 'R2',
        externalUrl: null,
        storageKey: 'Drive/k',
        mimeType: 'image/png',
        versions: [{ storageKey: 'Drive/k-v1', isCurrent: true }],
      });

      const result = await service.getAssetViewUrl('f1');

      expect(result.url).toBe('https://presigned-url.example.com');
      expect(result.mimeType).toBe('image/png');
    });

    it('getAssetViewUrl with document gate rejects when file not linked to document', async () => {
      prisma.employeeDepartment.findMany.mockResolvedValueOnce([]);
      prisma.document.findUnique.mockResolvedValueOnce({
        ownerId: 'e1',
        createdById: 'e1',
        listScopeOverride: null,
        section: { defaultListScope: 'ALL' },
      });
      prisma.documentAttachment.findFirst.mockResolvedValueOnce(null);
      prisma.fileLink.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.getAssetViewUrl('f1', {
          forDocumentId: 'doc-1',
          documentsAccess: {
            employeeId: 'e1',
            departmentIds: [],
            documentsViewScope: 'ALL',
          },
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.fileAsset.findFirst).not.toHaveBeenCalled();
    });

    it('getAssetViewUrl with document gate returns url when attachment exists', async () => {
      prisma.employeeDepartment.findMany.mockResolvedValueOnce([]);
      prisma.document.findUnique.mockResolvedValueOnce({
        ownerId: 'e1',
        createdById: 'e1',
        listScopeOverride: null,
        section: { defaultListScope: 'ALL' },
      });
      prisma.documentAttachment.findFirst.mockResolvedValueOnce({ id: 'att-1' });
      prisma.fileAsset.findFirst.mockResolvedValueOnce({
        id: 'f1',
        deletedAt: null,
        status: 'ACTIVE',
        storageProvider: 'R2',
        externalUrl: null,
        storageKey: 'Drive/k',
        mimeType: 'image/png',
        versions: [{ storageKey: 'Drive/k-v1', isCurrent: true }],
      });

      const result = await service.getAssetViewUrl('f1', {
        forDocumentId: 'doc-1',
        documentsAccess: {
          employeeId: 'e1',
          departmentIds: [],
          documentsViewScope: 'ALL',
        },
      });

      expect(result.url).toBe('https://presigned-url.example.com');
    });

    it('returns external url for EXTERNAL_URL file asset', async () => {
      prisma.fileAsset.findFirst.mockResolvedValueOnce({
        id: 'f1',
        deletedAt: null,
        status: 'ACTIVE',
        storageProvider: 'EXTERNAL_URL',
        externalUrl: 'https://cdn.example.com/x.png',
        mimeType: 'image/png',
        versions: [],
        storageKey: null,
      });

      const result = await service.getAssetViewUrl('f1');

      expect(result.url).toBe('https://cdn.example.com/x.png');
    });

    it('creates DB-backed File Asset metadata with version and link', async () => {
      const tenantStorageKey =
        'nbos/tenants/00000000-0000-4000-8000-000000000001/files/projects/p1/offer.pdf';
      const result = await service.createFileAsset({
        displayName: 'Approved offer.pdf',
        storageKey: tenantStorageKey,
        mimeType: 'application/pdf',
        sizeBytes: 123,
        purpose: 'OFFER',
        createdById: 'employee-1',
        link: {
          entityType: 'DEAL',
          entityId: 'deal-1',
          linkType: 'APPROVED_DOCUMENT',
          linkedById: 'employee-1',
        },
      });

      expect(result.displayName).toBe('Approved offer.pdf');
      expect(prisma.fileAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileType: 'DOCUMENT',
            purpose: 'OFFER',
            versions: {
              create: expect.objectContaining({
                versionNumber: 1,
                storageKey: tenantStorageKey,
              }),
            },
            links: {
              create: expect.objectContaining({
                entityType: 'DEAL',
                entityId: 'deal-1',
                linkType: 'APPROVED_DOCUMENT',
              }),
            },
          }),
        }),
      );
    });

    it('creates external link file assets without R2 version', async () => {
      await service.createFileAsset({
        displayName: 'Figma mockup',
        externalUrl: 'https://figma.example/file',
      });

      expect(prisma.fileAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileType: 'LINK',
            storageProvider: 'EXTERNAL_URL',
            versions: undefined,
          }),
        }),
      );
    });

    it('rejects non-view grants for sensitive files', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(
        policyFileRow({ confidentiality: 'FINANCE_SENSITIVE' }),
      );
      prisma.fileLink.count.mockResolvedValue(0);

      await expect(
        service.createFileAssetGrant(
          'f1',
          { granteeEmployeeId: 'emp-2', permission: 'SHARE' },
          'emp-1',
          { employeeId: 'emp-1', departmentIds: [], driveScope: 'OWN' },
        ),
      ).rejects.toThrow('Sensitive Drive files may only be shared with VIEW grants.');
    });

    it('stores optional grant expiry and audit reason', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(policyFileRow());
      prisma.fileLink.count.mockResolvedValue(0);
      prisma.fileAssetGrant.findFirst.mockResolvedValueOnce(null);
      prisma.fileAssetGrant.findMany.mockResolvedValue([]);

      await service.createFileAssetGrant(
        'f1',
        {
          granteeEmployeeId: 'emp-2',
          permission: 'VIEW',
          expiresAt: '2026-06-01T12:00:00.000Z',
          reason: 'Temporary review access',
        },
        'emp-1',
        { employeeId: 'emp-1', departmentIds: [], driveScope: 'OWN' },
      );

      expect(prisma.fileAssetGrant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            granteeEmployeeId: 'emp-2',
            expiresAt: new Date('2026-06-01T12:00:00.000Z'),
          }),
        }),
      );
      expect(prisma.resourceAccessGrant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType_resourceId_employeeId: {
              resourceType: 'drive_file_asset',
              resourceId: 'f1',
              employeeId: 'emp-2',
            },
          }),
        }),
      );
      expect(prisma.fileAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              reason: 'Temporary review access',
            }),
          }),
        }),
      );
    });

    it('rejects linking a file into an inaccessible target business context', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(policyFileRow());
      prisma.fileLink.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValueOnce({ id: 'company-1' });
      prisma.company.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.linkFileAsset(
          'f1',
          {
            entityType: 'COMPANY',
            entityId: 'company-1',
            linkedById: 'emp-1',
          },
          {
            employeeId: 'emp-1',
            departmentIds: [],
            driveScope: 'OWN',
          },
        ),
      ).rejects.toThrow('Drive context not found.');
    });

    it('requires upload-version permission when access comes only from a grant', async () => {
      const grantOnlyFile = policyFileRow({ ownerId: 'emp-2', createdById: 'emp-2' });
      prisma.fileAsset.findFirst.mockImplementation(async (args) => {
        const where = args?.where as { OR?: Array<{ ownerId?: string; createdById?: string }> };
        const or = where?.OR ?? [];
        const isOwnScopeLookup = or.some(
          (clause) => clause?.ownerId === 'emp-1' || clause?.createdById === 'emp-1',
        );
        if (isOwnScopeLookup) return null;
        return grantOnlyFile;
      });
      prisma.fileLink.count.mockResolvedValue(0);
      prisma.fileAssetGrant.findMany.mockResolvedValue([{ permission: 'VIEW' }]);

      await expect(
        service.createVersionUploadUrl(
          'f1',
          { fileName: 'v2.pdf', contentType: 'application/pdf' },
          { employeeId: 'emp-1', departmentIds: [], driveScope: 'OWN' },
        ),
      ).rejects.toThrow('You do not have permission to upload a new version.');
    });

    it('lists File Assets by entity link', async () => {
      await service.listFileAssets({ entityType: 'PRODUCT', entityId: 'product-1' });

      expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                links: {
                  some: { entityType: 'PRODUCT', entityId: 'product-1', unlinkedAt: null },
                },
              }),
            ]),
          }),
        }),
      );
    });

    it('requires projectId for Project files filter', async () => {
      await expect(service.listFileAssets({ projectHubProjectFiles: true })).rejects.toThrow(
        'projectId is required for Project files.',
      );
      expect(prisma.fileAsset.findMany).not.toHaveBeenCalled();
    });

    it('applies OWN drive scope to File Assets list', async () => {
      await service.listFileAssets(
        { search: 'offer' },
        { employeeId: 'emp-1', departmentIds: ['dep-1'], driveScope: 'OWN' },
      );

      expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                deletedAt: null,
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    OR: expect.arrayContaining([{ ownerId: 'emp-1' }, { createdById: 'emp-1' }]),
                  }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('applies layered sensitivity guard to ALL drive scope', async () => {
      await service.listFileAssets(
        { search: 'offer' },
        { employeeId: 'emp-1', departmentIds: ['dep-1'], driveScope: 'ALL' },
      );

      const listCall = prisma.fileAsset.findMany.mock.calls[0]?.[0] as {
        where?: { AND?: Array<Record<string, unknown>> };
      };
      expect(listCall?.where?.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            deletedAt: null,
            OR: expect.arrayContaining([
              expect.objectContaining({
                AND: [
                  { visibility: { notIn: ['PERSONAL', 'RESTRICTED'] } },
                  {
                    confidentiality: {
                      notIn: ['FINANCE_SENSITIVE', 'LEGAL_SENSITIVE', 'SECRET_ADJACENT'],
                    },
                  },
                ],
              }),
              expect.objectContaining({
                OR: [{ ownerId: 'emp-1' }, { createdById: 'emp-1' }],
              }),
            ]),
          }),
        ]),
      );
    });

    it('applies department scope together with layered sensitivity guard', async () => {
      prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: 'emp-2' }]);

      await service.listFileAssets(
        { search: 'offer' },
        { employeeId: 'emp-1', departmentIds: ['dep-1'], driveScope: 'DEPARTMENT' },
      );

      const listCall = prisma.fileAsset.findMany.mock.calls[0]?.[0] as {
        where?: { AND?: Array<{ deletedAt?: null; OR?: unknown[] }> };
      };
      const accessClause = listCall?.where?.AND?.find((clause) => clause.deletedAt === null);
      expect(accessClause?.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { ownerId: { in: ['emp-2'] } },
                  { createdById: { in: ['emp-2'] } },
                  { ownerId: 'emp-1' },
                  { createdById: 'emp-1' },
                ]),
              }),
            ]),
          }),
        ]),
      );
    });

    it('lists File Assets with sharedWithMe excluding sole self-originated files', async () => {
      await service.listFileAssets(
        { sharedWithMe: true },
        { employeeId: 'emp-1', departmentIds: ['dep-1'], driveScope: 'ALL' },
      );

      const sharedCall = prisma.fileAsset.findMany.mock.calls[0]?.[0] as {
        where?: { AND?: Array<{ OR?: unknown[] }> };
      };
      const sharedClause = sharedCall?.where?.AND?.find(
        (clause) =>
          Array.isArray(clause.OR) &&
          clause.OR.some((part) => part && typeof part === 'object' && 'NOT' in part),
      );
      expect(sharedClause?.OR).toEqual(
        expect.arrayContaining([
          {
            NOT: {
              OR: [{ ownerId: 'emp-1' }, { AND: [{ ownerId: null }, { createdById: 'emp-1' }] }],
            },
          },
          expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                assetGrants: expect.objectContaining({
                  some: expect.objectContaining({ granteeEmployeeId: 'emp-1' }),
                }),
              }),
            ]),
          }),
        ]),
      );
    });

    it('restores archived file asset lifecycle state', async () => {
      prisma.fileAsset.findFirst.mockResolvedValueOnce({ id: 'f1' });
      prisma.fileAsset.update.mockResolvedValueOnce({
        id: 'f1',
        status: 'ACTIVE',
        archivedAt: null,
      });

      const result = await service.restoreFileAsset('f1', 'employee-1');

      expect(result.status).toBe('ACTIVE');
      expect(prisma.fileAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'f1' },
          data: expect.objectContaining({
            status: 'ACTIVE',
            archivedAt: null,
          }),
        }),
      );
    });

    it('archives file assets in batch', async () => {
      prisma.$transaction.mockImplementationOnce(async (cb: unknown) => {
        if (typeof cb !== 'function') return undefined;
        return (cb as (tx: MockPrisma) => Promise<unknown>)(prisma);
      });
      prisma.fileAsset.findMany
        .mockResolvedValueOnce([{ id: 'f1' }, { id: 'f2' }])
        .mockResolvedValueOnce([{ id: 'f1' }, { id: 'f2' }]);

      const result = await service.archiveFileAssets(['f1', 'f2', 'f1'], 'employee-1');

      expect(prisma.fileAsset.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['f1', 'f2'] }, deletedAt: null },
        }),
      );
      expect(prisma.fileAuditEvent.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({ fileAssetId: 'f1', action: 'archived' }),
            expect.objectContaining({ fileAssetId: 'f2', action: 'archived' }),
          ],
        }),
      );
      expect(result).toHaveProperty('updated');
    });

    it('creates batch archive audit only for matched files', async () => {
      prisma.$transaction.mockImplementationOnce(async (cb: unknown) => {
        if (typeof cb !== 'function') return undefined;
        return (cb as (tx: MockPrisma) => Promise<unknown>)(prisma);
      });
      prisma.fileAsset.findMany
        .mockResolvedValueOnce([{ id: 'f2' }])
        .mockResolvedValueOnce([{ id: 'f2' }]);

      await service.archiveFileAssets(['f1', 'f2'], 'employee-1');

      expect(prisma.fileAuditEvent.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ fileAssetId: 'f2', action: 'archived' })],
      });
    });
  });

  describe('without R2 configured', () => {
    it('should throw NotFoundException when listing files', async () => {
      const service = new DriveService(
        createMockPrisma() as never,
        makeUnavailableR2() as never,
        makeNotificationsMock() as never,
        makeProjectHubMock() as never,
        makeConfigMock() as never,
      );
      await expect(service.listFiles('p1')).rejects.toThrow(NotFoundException);
    });
  });
});
