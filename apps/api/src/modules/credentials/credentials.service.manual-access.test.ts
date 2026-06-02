import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService manual access & sheet audit', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];
  let auditService: ReturnType<typeof createCredentialsServiceTestContext>['auditService'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
    auditService = ctx.auditService;
  });

  it('lists manual grants for an accessible credential', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: 'cred-1', projectId: 'p1' });
    prisma.resourceAccessGrant.findMany.mockResolvedValue([
      {
        employeeId: 'emp-2',
        level: 'VIEW',
        expiresAt: null,
        createdAt: new Date('2026-01-01'),
        employee: { id: 'emp-2', firstName: 'A', lastName: 'B', email: 'a@b.c' },
        grantedBy: null,
      },
    ]);

    const result = await service.listManualAccess('cred-1', accessUser1);
    expect(result.grants).toHaveLength(1);
    expect(result.grants[0]?.level).toBe('VIEW');
  });

  it('replaces manual grants and logs audit', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: 'cred-1', projectId: null });
    prisma.resourceAccessGrant.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        employeeId: 'emp-2',
        level: 'EDIT',
        expiresAt: null,
        createdAt: new Date(),
        employee: { id: 'emp-2', firstName: 'A', lastName: 'B', email: 'a@b.c' },
        grantedBy: { id: 'user-1', firstName: 'U', lastName: '1' },
      },
    ]);

    await service.replaceManualAccess(
      'cred-1',
      [{ employeeId: 'emp-2', level: 'EDIT' }],
      accessUser1,
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.manual_access_updated' }),
    );
  });

  it('returns sheet audit entries', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: 'cred-1', projectId: null });
    auditService.findByEntity.mockResolvedValue({
      items: [{ id: 'log-1', action: 'credential.view', createdAt: new Date().toISOString() }],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });

    const result = await service.listSheetAudit('cred-1', accessUser1, 1);
    expect(result.items).toHaveLength(1);
    expect(auditService.findByEntity).toHaveBeenCalledWith('credential', 'cred-1', {
      page: 1,
      pageSize: 20,
    });
  });

  it('throws when credential is not accessible', async () => {
    prisma.credential.findFirst.mockResolvedValue(null);
    await expect(service.listManualAccess('missing', accessUser1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
