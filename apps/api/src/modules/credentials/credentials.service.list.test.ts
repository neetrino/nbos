import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  accessOwnerAll,
  accessUser1,
  createCredentialsServiceTestContext,
} from './credentials.service.fixture';

describe('CredentialsService findAll', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];

  beforeEach(() => {
    const setup = createCredentialsServiceTestContext();
    service = setup.service;
    prisma = setup.prisma;
    prisma.auditLog.findMany.mockResolvedValue([]);
  });

  it('should list credentials without sensitive fields', async () => {
    const mockItems = [{ id: '1', name: 'Admin Panel', category: 'ADMIN', provider: 'AWS' }];
    prisma.credential.findMany.mockResolvedValue(mockItems);
    prisma.credential.count.mockResolvedValue(1);

    const result = await service.findAll(
      { page: 1, pageSize: 10, sort: 'created_desc' },
      accessUser1,
    );

    expect(result.items).toEqual([
      expect.objectContaining({
        id: '1',
        name: 'Admin Panel',
        secretsPresent: { password: false, apiKey: false, envData: false, secureNotes: false },
      }),
    ]);
    expect(result.meta.total).toBe(1);
  });

  it('should list archived credentials when includeArchived is true', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll({ includeArchived: true, sort: 'created_desc' }, accessUser1);
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ archivedAt: { not: null } }),
      }),
    );
  });

  it('should filter by projectId', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll({ projectId: 'proj-1', sort: 'created_desc' }, accessUser1);
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ projectId: 'proj-1' }) }),
    );
  });

  it('should filter by category', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll({ category: 'API_KEY', sort: 'created_desc' }, accessUser1);
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ category: 'API_KEY' }) }),
    );
  });

  it('should search by name, provider, login', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll(
      { search: 'aws', employeeId: 'user-1', departmentIds: [], sort: 'created_desc' },
      accessUser1,
    );
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ name: { contains: 'aws', mode: 'insensitive' } }]),
        }),
      }),
    );
  });

  it('skips credential-level visibility filter when RBAC viewScope is ALL', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll(
      { employeeId: 'owner-1', departmentIds: [], viewScope: 'ALL', sort: 'created_desc' },
      accessOwnerAll,
    );
    const call = prisma.credential.findMany.mock.calls[0]?.[0] as { where: { OR?: unknown } };
    expect(call.where.OR).toBeUndefined();
  });

  it('scopes my tab to PERSONAL credentials owned by the employee', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll(
      {
        tab: 'personal',
        employeeId: 'emp-1',
        departmentIds: ['dept-1'],
        viewScope: 'ALL',
        sort: 'created_desc',
      },
      accessOwnerAll,
    );
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accessLevel: 'PERSONAL', ownerId: 'emp-1' }),
      }),
    );
  });

  it('scopes project tab to PROJECT_TEAM access level', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll(
      {
        tab: 'project',
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'ALL',
        sort: 'created_desc',
      },
      accessOwnerAll,
    );
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accessLevel: 'PROJECT_TEAM' }),
      }),
    );
  });

  it('lists all SECRET credentials on secret tab when RBAC viewScope is ALL', async () => {
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.credential.count.mockResolvedValue(0);
    await service.findAll(
      {
        tab: 'secret',
        employeeId: 'owner-1',
        departmentIds: [],
        viewScope: 'ALL',
        sort: 'created_desc',
      },
      accessOwnerAll,
    );
    expect(prisma.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accessLevel: 'SECRET' }),
      }),
    );
  });

  it('adds health metadata for rotation due/overdue flags', async () => {
    prisma.credential.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'Critical Vault',
        criticality: 'CRITICAL',
        accessLevel: 'ALL',
        ownerId: null,
        nextRotationAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    ]);
    prisma.credential.count.mockResolvedValue(1);
    const result = await service.findAll(
      { page: 1, pageSize: 10, sort: 'created_desc' },
      accessUser1,
    );
    const first = result.items[0] as { health?: { status: string; flags: string[] } };
    expect(first.health?.status).toBe('OVERDUE');
    expect(first.health?.flags).toContain('MISSING_OWNER');
    expect(first.health?.flags).toContain('BROAD_ACCESS');
  });
});

describe('CredentialsService findById', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];
  let auditService: ReturnType<typeof createCredentialsServiceTestContext>['auditService'];

  beforeEach(() => {
    const setup = createCredentialsServiceTestContext();
    service = setup.service;
    prisma = setup.prisma;
    auditService = setup.auditService;
  });

  it('should return credential without secret values and log view audit', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      name: 'Server',
      password: 'enc:tag:secret',
      apiKey: null,
      envData: null,
      projectId: 'proj-1',
      project: { id: 'proj-1', name: 'Test' },
    });
    const result = await service.findById('1', accessUser1);
    expect(result).not.toHaveProperty('password');
    expect(result.secretsPresent).toEqual({
      password: true,
      apiKey: false,
      envData: false,
      secureNotes: false,
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.view', userId: 'user-1', entityId: '1' }),
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

  it('returns foreign SECRET credential when RBAC viewScope is ALL', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: 'secret-1',
      name: 'Root vault',
      password: 'enc:tag:secret',
      apiKey: null,
      envData: null,
      projectId: null,
      project: null,
    });
    const result = await service.findById('secret-1', accessOwnerAll);
    expect(result).toEqual(expect.objectContaining({ id: 'secret-1' }));
    const call = prisma.credential.findFirst.mock.calls[0]?.[0] as { where: { OR?: unknown } };
    expect(call.where.OR).toBeUndefined();
  });
});
