import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService emergency access', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];
  let auditService: ReturnType<typeof createCredentialsServiceTestContext>['auditService'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
    auditService = ctx.auditService;
  });

  it('rejects non-executive roles', async () => {
    prisma.employee.findUnique.mockResolvedValue({ role: { slug: 'developer' } });
    await expect(
      service.grantEmergencyAccess(
        'cred-1',
        { reason: 'Project incident recovery', stepUpPassword: 'pwd' },
        accessUser1,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('grants temporary VIEW and logs audit for executives without row access', async () => {
    prisma.employee.findUnique
      .mockResolvedValueOnce({ role: { slug: 'ceo' } })
      .mockResolvedValueOnce({ passwordHash: 'hash' });
    prisma.credential.findFirst
      .mockResolvedValueOnce({
        id: 'cred-1',
        name: 'Prod DB',
        ownerId: 'owner-1',
        criticality: 'CRITICAL',
        projectId: 'p1',
      })
      .mockResolvedValueOnce(null);
    prisma.resourceAccessGrant.upsert.mockResolvedValue({});

    const result = await service.grantEmergencyAccess(
      'cred-1',
      { reason: 'Production outage recovery', stepUpPassword: 'pwd' },
      accessUser1,
    );

    expect(result.credentialId).toBe('cred-1');
    expect(result.level).toBe('VIEW');
    expect(prisma.resourceAccessGrant.upsert).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.emergency_access_used', entityId: 'cred-1' }),
    );
  });

  it('rejects when caller already has visibility', async () => {
    prisma.employee.findUnique
      .mockResolvedValueOnce({ role: { slug: 'admin' } })
      .mockResolvedValueOnce({ passwordHash: 'hash' });
    prisma.credential.findFirst
      .mockResolvedValueOnce({
        id: 'cred-1',
        name: 'Prod DB',
        ownerId: null,
        criticality: 'HIGH',
        projectId: null,
      })
      .mockResolvedValueOnce({ id: 'cred-1' });

    await expect(
      service.grantEmergencyAccess(
        'cred-1',
        { reason: 'Should not apply', stepUpPassword: 'pwd' },
        accessUser1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
