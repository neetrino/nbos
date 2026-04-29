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

describe('DriveService', () => {
  describe('with R2 configured', () => {
    let service: DriveService;
    let prisma: MockPrisma;

    beforeEach(() => {
      vi.clearAllMocks();
      prisma = createMockPrisma();
      service = new DriveService(prisma as never, makeR2Mock() as never);
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
      const result = await service.createFileAsset({
        displayName: 'Approved offer.pdf',
        storageKey: 'Drive/projects/p1/offer.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123,
        purpose: 'OFFER_APPROVED',
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
            purpose: 'OFFER_APPROVED',
            versions: {
              create: expect.objectContaining({
                versionNumber: 1,
                storageKey: 'Drive/projects/p1/offer.pdf',
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

    it('lists File Assets by entity link', async () => {
      await service.listFileAssets({ entityType: 'PRODUCT', entityId: 'product-1' });

      expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            links: { some: { entityType: 'PRODUCT', entityId: 'product-1', unlinkedAt: null } },
          }),
        }),
      );
    });
  });

  describe('without R2 configured', () => {
    it('should throw NotFoundException when listing files', async () => {
      const service = new DriveService(createMockPrisma() as never, makeUnavailableR2() as never);
      await expect(service.listFiles('p1')).rejects.toThrow(NotFoundException);
    });
  });
});
