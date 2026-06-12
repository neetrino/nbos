import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import * as crypto from '../../common/utils/crypto';
import {
  TEST_KEY,
  accessUser1,
  createCredentialsServiceTestContext,
} from './credentials.service.fixture';

describe('CredentialsService mutations', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];
  let auditService: ReturnType<typeof createCredentialsServiceTestContext>['auditService'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
    auditService = ctx.auditService;
  });

  it('should encrypt sensitive fields and log audit on create', async () => {
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
      passphrase: false,
      apiKey: true,
      envData: true,
      secureNotes: false,
    });
    expect(crypto.encrypt).toHaveBeenCalledWith('mypass', TEST_KEY);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.create' }),
    );
  });

  it('should not encrypt null sensitive fields on create', async () => {
    prisma.credential.create.mockResolvedValue({
      id: 'new-2',
      name: 'Simple Cred',
      category: 'ADMIN',
      password: null,
      apiKey: null,
      envData: null,
      projectId: null,
      project: null,
    });
    await service.create({ name: 'Simple Cred', category: 'ADMIN' }, 'user-1');
    expect(crypto.encrypt).not.toHaveBeenCalledWith(null, expect.anything());
  });

  it('should encrypt changed fields and log audit on update', async () => {
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

  it('should throw NotFoundException on update when missing', async () => {
    prisma.credential.findFirst.mockResolvedValue(null);
    await expect(service.update('missing', { name: 'x' }, accessUser1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should archive credential and clear folder memberships in one transaction', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: '1', projectId: 'proj-1' });
    prisma.credential.update.mockResolvedValue({ id: '1' });
    prisma.credentialFolderMembership.deleteMany.mockResolvedValue({ count: 2 });

    await service.archive('1', accessUser1);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.credentialFolderMembership.deleteMany).toHaveBeenCalledWith({
      where: { credentialId: '1' },
    });
    expect(prisma.credential.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.archived', entityId: '1' }),
    );
  });

  it('should restore archived credential', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      projectId: 'proj-1',
      archivedAt: new Date(),
    });
    prisma.credential.update.mockResolvedValue({ id: '1' });
    await service.restore('1', accessUser1);
    expect(prisma.credential.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { archivedAt: null },
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.restored', entityId: '1' }),
    );
  });

  it('should permanently delete archived credential after step-up', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      projectId: 'p1',
      criticality: 'LOW',
      archivedAt: new Date(),
    });
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'enc:tag:hash' });
    await service.permanentlyDelete('1', accessUser1, 'step-up');
    expect(prisma.credential.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.permanently_deleted', entityId: '1' }),
    );
  });

  it('should throw when permanently deleting non-archived credential', async () => {
    prisma.credential.findFirst.mockResolvedValue(null);
    await expect(service.permanentlyDelete('1', accessUser1)).rejects.toThrow(NotFoundException);
    expect(prisma.credential.delete).not.toHaveBeenCalled();
  });
});
