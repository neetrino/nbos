import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { AuditService } from '../audit/audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import * as crypto from '../../common/utils/crypto';

vi.mock('../../common/utils/crypto', () => ({
  encrypt: vi.fn((text: string) => `enc:tag:${text}`),
  decrypt: vi.fn((text: string) => text.replace('enc:tag:', '')),
}));

const TEST_KEY = 'test-key-for-credentials';

const accessUser1 = { employeeId: 'user-1', departmentIds: [] as string[] };

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

      expect(result.items).toEqual([
        expect.objectContaining({
          id: '1',
          name: 'Admin Panel',
          secretsPresent: {
            password: false,
            apiKey: false,
            envData: false,
            secureNotes: false,
          },
        }),
      ]);
      expect(result.meta.total).toBe(1);
      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ archivedAt: null }),
          select: expect.objectContaining({
            password: true,
            apiKey: true,
            envData: true,
            secureNotes: true,
          }),
        }),
      );
    });

    it('should list archived credentials when includeArchived is true', async () => {
      prisma.credential.findMany.mockResolvedValue([]);
      prisma.credential.count.mockResolvedValue(0);

      await service.findAll({ includeArchived: true });

      expect(prisma.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ archivedAt: { not: null } }),
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
    it('should return credential without secret values and log view audit', async () => {
      const mockCred = {
        id: '1',
        name: 'Server',
        password: 'enc:tag:secret',
        apiKey: null,
        envData: null,
        projectId: 'proj-1',
        project: { id: 'proj-1', name: 'Test' },
      };
      prisma.credential.findFirst.mockResolvedValue(mockCred);

      const result = await service.findById('1', accessUser1);

      expect(result).not.toHaveProperty('password');
      expect(result.secretsPresent).toEqual({
        password: true,
        apiKey: false,
        envData: false,
        secureNotes: false,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.view',
          userId: 'user-1',
          entityId: '1',
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.findById('missing', accessUser1)).rejects.toThrow(NotFoundException);
    });

    it('should not audit view when credential is not accessible to user', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.findById('secret-1', accessUser1)).rejects.toThrow(NotFoundException);
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('revealSecretField', () => {
    it('should decrypt field and log secret_revealed', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        password: 'enc:tag:secret',
        apiKey: null,
        envData: null,
        projectId: 'p1',
      });

      const result = await service.revealSecretField('1', 'password', accessUser1);

      expect(result).toEqual({ field: 'password', value: 'secret' });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.secret_revealed',
          changes: ['password'],
        }),
      );
    });

    it('should reject invalid field name', async () => {
      await expect(service.revealSecretField('1', 'login', accessUser1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject when field is empty', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        password: null,
        apiKey: null,
        envData: null,
        projectId: null,
      });

      await expect(service.revealSecretField('1', 'password', accessUser1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('copySecretField', () => {
    it('should decrypt field and log secret_copied', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        password: 'enc:tag:x',
        apiKey: null,
        envData: null,
        projectId: null,
      });

      const result = await service.copySecretField('1', 'password', accessUser1);

      expect(result).toEqual({ field: 'password', value: 'x' });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.secret_copied',
          changes: ['password'],
        }),
      );
    });
  });

  describe('recordUrlOpened', () => {
    it('should return url and log url_opened for safe https URL', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        url: 'https://example.com/path',
        projectId: 'p1',
      });

      const result = await service.recordUrlOpened('1', accessUser1);

      expect(result).toEqual({ url: 'https://example.com/path' });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.url_opened',
          entityId: '1',
        }),
      );
    });

    it('should reject javascript: URLs', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        url: 'javascript:alert(1)',
        projectId: null,
      });

      await expect(service.recordUrlOpened('1', accessUser1)).rejects.toThrow(BadRequestException);
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should reject empty URL', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        url: '   ',
        projectId: null,
      });

      await expect(service.recordUrlOpened('1', accessUser1)).rejects.toThrow(BadRequestException);
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

      const created = await service.create(input, 'user-1');
      expect(created.secretsPresent).toEqual({
        password: true,
        apiKey: true,
        envData: true,
        secureNotes: false,
      });
      expect(created).not.toHaveProperty('password');

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
      prisma.credential.findFirst.mockResolvedValue({
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

      await service.update('1', { name: 'New Name', password: 'newpass' }, accessUser1);

      expect(crypto.encrypt).toHaveBeenCalledWith('newpass', TEST_KEY);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.update',
          changes: expect.arrayContaining(['name', 'password']),
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'x' }, accessUser1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('should set archivedAt and log credential.archived', async () => {
      prisma.credential.findFirst.mockResolvedValue({ id: '1', projectId: 'proj-1' });
      prisma.credential.update.mockResolvedValue({ id: '1' });

      await service.archive('1', accessUser1);

      expect(prisma.credential.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ archivedAt: expect.any(Date) }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.archived',
          entityId: '1',
        }),
      );
    });

    it('should throw NotFoundException for missing credential', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.archive('missing', accessUser1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should clear archivedAt and log credential.restored', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        projectId: 'proj-1',
        archivedAt: new Date(),
      });
      prisma.credential.update.mockResolvedValue({ id: '1' });

      await service.restore('1', accessUser1);

      expect(prisma.credential.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { archivedAt: null },
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.restored',
          entityId: '1',
        }),
      );
    });

    it('should throw NotFoundException when credential is not archived', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.restore('missing', accessUser1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('permanentlyDelete', () => {
    it('should delete row when archived and log permanently_deleted', async () => {
      prisma.credential.findFirst.mockResolvedValue({
        id: '1',
        projectId: 'p1',
        archivedAt: new Date(),
      });

      await service.permanentlyDelete('1', accessUser1);

      expect(prisma.credential.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'credential.permanently_deleted',
          entityId: '1',
        }),
      );
    });

    it('should throw when credential is not archived', async () => {
      prisma.credential.findFirst.mockResolvedValue(null);

      await expect(service.permanentlyDelete('1', accessUser1)).rejects.toThrow(NotFoundException);
      expect(prisma.credential.delete).not.toHaveBeenCalled();
    });
  });
});
