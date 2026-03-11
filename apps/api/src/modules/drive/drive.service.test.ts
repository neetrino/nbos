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
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

import { DriveService } from './drive.service';

function createMockConfig(withR2 = true) {
  const configMap: Record<string, string> = withR2
    ? {
        R2_ACCOUNT_ID: 'test-account',
        R2_BUCKET_NAME: 'test-bucket',
        R2_ACCESS_KEY_ID: 'test-key-id',
        R2_SECRET_ACCESS_KEY: 'test-secret',
        R2_PUBLIC_URL: 'https://cdn.example.com',
      }
    : {};

  return {
    get: vi.fn((key: string) => configMap[key] ?? undefined),
    getOrThrow: vi.fn((key: string) => {
      const val = configMap[key];
      if (!val) throw new Error(`Missing ${key}`);
      return val;
    }),
  };
}

describe('DriveService', () => {
  describe('with R2 configured', () => {
    let service: DriveService;

    beforeEach(() => {
      vi.clearAllMocks();
      const config = createMockConfig(true);
      service = new DriveService(config as never);
    });

    it('should list files from R2', async () => {
      mockSend.mockResolvedValueOnce({
        CommonPrefixes: [{ Prefix: 'projects/p1/docs/' }],
        Contents: [{ Key: 'projects/p1/readme.txt', Size: 1024, LastModified: new Date() }],
      });

      const files = await service.listFiles('p1');

      expect(files.length).toBe(2);
      expect(files[0]!.isFolder).toBe(true);
      expect(files[0]!.name).toBe('docs');
      expect(files[1]!.name).toBe('readme.txt');
    });

    it('should generate upload URL', async () => {
      const result = await service.getUploadUrl('p1', 'test.pdf', 'application/pdf');

      expect(result.uploadUrl).toBe('https://presigned-url.example.com');
      expect(result.key).toBe('projects/p1/test.pdf');
      expect(result.publicUrl).toBe('https://cdn.example.com/projects/p1/test.pdf');
    });

    it('should generate download URL', async () => {
      const result = await service.getDownloadUrl('p1', 'docs/file.pdf');

      expect(result.downloadUrl).toBe('https://presigned-url.example.com');
    });

    it('should delete a file', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(service.deleteFile('p1', 'test.pdf')).resolves.toBeUndefined();
    });

    it('should build project structure tree', async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'projects/p1/docs/readme.md', Size: 512, LastModified: new Date() },
          { Key: 'projects/p1/src/index.ts', Size: 256, LastModified: new Date() },
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
  });

  describe('without R2 configured', () => {
    it('should not crash at construction time', () => {
      const config = createMockConfig(false);
      expect(() => new DriveService(config as never)).not.toThrow();
    });

    it('should throw NotFoundException when listing files', async () => {
      const config = createMockConfig(false);
      const service = new DriveService(config as never);
      await expect(service.listFiles('p1')).rejects.toThrow(NotFoundException);
    });
  });
});
