import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { AuditService } from '../audit/audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import * as crypto from '../../common/utils/crypto';

vi.mock('../../common/utils/crypto', () => ({
  encrypt: vi.fn((text: string) => `enc:tag:${text}`),
  decrypt: vi.fn((text: string) => text.replace('enc:tag:', '')),
}));

const TEST_KEY = 'test-key-for-credentials';

function createMockConfigService() {
  return {
    get: vi.fn((key: string) => {
      if (key === 'CREDENTIALS_ENCRYPTION_KEY') return TEST_KEY;
      return undefined;
    }),
  };
}

function createMockAuditService(): Partial<AuditService> {
  return {
    log: vi.fn(),
  };
}

describe('CredentialsService', () => {
  let service: CredentialsService;
  let prisma: MockPrisma;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService = createMockAuditService();
    const configService = createMockConfigService();

    service = new CredentialsService(
      prisma as never,
      configService as never,
      auditService as never,
    );
  });

  describe('findAll', () => {
    it('should list credentials without sensitive fields', async () => {
      const mockItems = [{ id: '1', name: 'Admin Panel', category: 'ADMIN', provider: 'AWS' }];
      prisma.credential.findMany.mockResolvedValue(mockItems);
      prisma.credential.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toEqual(mockItems);
      expect(result.meta.total).toBe(1);
      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({ password: true }),
        }),
      );
    });

    it('should filter by projectId', async () => {
      prisma.credential.findMany.mockResolvedValue([]);
      prisma.credential.count.mockResolvedValue(0);

      await service.findAll({ projectId: 'proj-1' });

      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('should filter by category', async () => {
      prisma.credential.findMany.mockResolvedValue([]);
      prisma.credential.count.mockResolvedValue(0);

      await service.findAll({ category: 'API_KEY' });

      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'API_KEY' }),
        }),
      );
    });

    it('should search by name, provider, login', async () => {
      prisma.credential.findMany.mockResolvedValue([]);
      prisma.credential.count.mockResolvedValue(0);

      await service.findAll({ search: 'aws' });

      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ name: { contains: 'aws', mode: 'insensitive' } }]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return decrypted credential and log audit', async () => {
      const mockCred = {
        id: '1',
        name: 'Server',
        password: 'enc:tag:secret',
        apiKey: null,
        envData: null,
        projectId: 'proj-1',
        project: { id: 'proj-1', name: 'Test' },
      };
      prisma.credential.findUnique.mockResolvedValue(mockCred);

      const result = await service.findById('1', 'user-1');

      expect(result.password).toBe('secret');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.view',
          userId: 'user-1',
          entityId: '1',
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should encrypt sensitive fields and log audit', async () => {
      const input = {
        name: 'DB Creds',
        category: 'DATABASE',
        password: 'mypass',
        apiKey: 'mykey',
        envData: 'SECRET=value',
      };

      prisma.credential.create.mockResolvedValue({
        id: 'new-1',
        ...input,
        password: 'enc:tag:mypass',
        apiKey: 'enc:tag:mykey',
        envData: 'enc:tag:SECRET=value',
        projectId: null,
        project: null,
      });

      await service.create(input, 'user-1');

      expect(crypto.encrypt).toHaveBeenCalledWith('mypass', TEST_KEY);
      expect(crypto.encrypt).toHaveBeenCalledWith('mykey', TEST_KEY);
      expect(crypto.encrypt).toHaveBeenCalledWith('SECRET=value', TEST_KEY);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.create',
        }),
      );
    });

    it('should not encrypt null/undefined sensitive fields', async () => {
      const input = {
        name: 'Simple Cred',
        category: 'ADMIN',
      };

      prisma.credential.create.mockResolvedValue({
        id: 'new-2',
        ...input,
        password: null,
        apiKey: null,
        envData: null,
        projectId: null,
        project: null,
      });

      await service.create(input, 'user-1');

      expect(crypto.encrypt).not.toHaveBeenCalledWith(null, expect.anything());
    });
  });

  describe('update', () => {
    it('should encrypt changed fields and log audit with diff', async () => {
      prisma.credential.findUnique.mockResolvedValue({
        id: '1',
        name: 'Old Name',
        password: 'enc:tag:old',
      });
      prisma.credential.update.mockResolvedValue({
        id: '1',
        name: 'New Name',
        password: 'enc:tag:newpass',
        apiKey: null,
        envData: null,
        projectId: null,
        project: null,
      });

      await service.update('1', { name: 'New Name', password: 'newpass' }, 'user-1');

      expect(crypto.encrypt).toHaveBeenCalledWith('newpass', TEST_KEY);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.update',
          changes: expect.arrayContaining(['name', 'password']),
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'x' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete and log audit', async () => {
      prisma.credential.findUnique.mockResolvedValue({ id: '1', projectId: 'proj-1' });

      await service.delete('1', 'user-1');

      expect(prisma.credential.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.delete',
          entityId: '1',
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
