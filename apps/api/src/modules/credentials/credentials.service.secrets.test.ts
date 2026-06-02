import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService secrets', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];
  let auditService: ReturnType<typeof createCredentialsServiceTestContext>['auditService'];
  let notifications: ReturnType<typeof createCredentialsServiceTestContext>['notifications'];
  let vaultSession: ReturnType<typeof createCredentialsServiceTestContext>['vaultSession'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
    auditService = ctx.auditService;
    notifications = ctx.notifications;
    vaultSession = ctx.vaultSession;
  });

  it('should decrypt LOW criticality field without step-up password', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'LOW',
      password: 'enc:tag:secret',
      apiKey: null,
      envData: null,
      projectId: 'p1',
    });
    const result = await service.revealSecretField('1', 'password', undefined, accessUser1);
    expect(result).toEqual({ field: 'password', value: 'secret' });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.secret_revealed', changes: ['password'] }),
    );
    expect(vaultSession.isUnlocked).not.toHaveBeenCalled();
  });

  it('should reject invalid reveal field name', async () => {
    await expect(service.revealSecretField('1', 'login', undefined, accessUser1)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject reveal when field is empty', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'LOW',
      password: null,
      apiKey: null,
      envData: null,
      projectId: null,
    });
    await expect(
      service.revealSecretField('1', 'password', undefined, accessUser1),
    ).rejects.toThrow(BadRequestException);
  });

  it('should require step-up for CRITICAL reveal when vault is locked', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'CRITICAL',
      password: 'enc:tag:secret',
      apiKey: null,
      envData: null,
      projectId: 'p1',
    });
    vaultSession.isUnlocked.mockResolvedValue(false);
    await expect(
      service.revealSecretField('1', 'password', undefined, accessUser1),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reveal CRITICAL field when vault is unlocked', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'CRITICAL',
      password: 'enc:tag:secret',
      apiKey: null,
      envData: null,
      projectId: 'p1',
    });
    vaultSession.isUnlocked.mockResolvedValue(true);
    const result = await service.revealSecretField('1', 'password', undefined, accessUser1);
    expect(result).toEqual({ field: 'password', value: 'secret' });
  });

  it('should decrypt field and log secret_copied for MEDIUM without step-up', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'MEDIUM',
      password: 'enc:tag:x',
      apiKey: null,
      envData: null,
      projectId: null,
    });
    const result = await service.copySecretField('1', 'password', undefined, accessUser1);
    expect(result).toEqual({ field: 'password', value: 'x' });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.secret_copied', changes: ['password'] }),
    );
  });

  it('should reject copy for CRITICAL without step-up when vault locked', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      criticality: 'CRITICAL',
      password: 'enc:tag:x',
      apiKey: null,
      envData: null,
      projectId: null,
    });
    vaultSession.isUnlocked.mockResolvedValue(false);
    await expect(service.copySecretField('1', 'password', undefined, accessUser1)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should export visible credentials after fresh step-up', async () => {
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'enc:tag:hash' });
    prisma.credential.findMany.mockResolvedValue([
      {
        id: 'c-1',
        name: 'Prod DB',
        category: 'DATABASE',
        credentialType: 'DATABASE',
        criticality: 'CRITICAL',
        accessLevel: 'SECRET',
        ownerId: 'owner-1',
        projectId: 'p-1',
        password: 'enc:tag:db-pass',
        apiKey: null,
        envData: null,
        secureNotes: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    prisma.employee.findMany.mockResolvedValue([{ id: 'admin-1' }]);
    const result = await service.exportCredentials({ stepUpPassword: 'step-up' }, accessUser1);
    expect(result.count).toBe(1);
    expect(result.items[0]?.secrets.password).toBe('db-pass');
    expect(notifications.create).toHaveBeenCalled();
    expect(vaultSession.unlock).not.toHaveBeenCalled();
  });

  it('should return url and log url_opened for safe https URL', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      url: 'https://example.com/path',
      projectId: 'p1',
    });
    const result = await service.recordUrlOpened('1', accessUser1);
    expect(result).toEqual({ url: 'https://example.com/path' });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.url_opened', entityId: '1' }),
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
    prisma.credential.findFirst.mockResolvedValue({ id: '1', url: '   ', projectId: null });
    await expect(service.recordUrlOpened('1', accessUser1)).rejects.toThrow(BadRequestException);
  });
});
