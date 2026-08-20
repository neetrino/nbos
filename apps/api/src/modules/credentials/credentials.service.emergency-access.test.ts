import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  accessOwnerAll,
  accessUser1,
  createCredentialsServiceTestContext,
} from './credentials.service.fixture';

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

  it('creates a pending request and audits instead of self-granting', async () => {
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'hash' });
    prisma.credential.findFirst
      .mockResolvedValueOnce({
        id: 'cred-1',
        name: 'Prod DB',
        ownerId: 'owner-1',
        projectId: 'p1',
        confidentiality: 'NORMAL',
      })
      .mockResolvedValueOnce(null);
    prisma.credentialEmergencyAccessRequest.findFirst.mockResolvedValue(null);
    prisma.credentialEmergencyAccessRequest.create.mockResolvedValue({
      id: 'req-1',
      status: 'PENDING',
    });
    prisma.platformOwnership.findUnique.mockResolvedValue({ ownerEmployeeId: 'founder-1' });

    const result = await service.requestEmergencyAccess(
      'cred-1',
      { reason: 'Production outage recovery', stepUpPassword: 'pwd' },
      accessUser1,
    );

    expect(result).toEqual({ requestId: 'req-1', status: 'PENDING' });
    expect(prisma.resourceAccessGrant.upsert).not.toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'credential.emergency_access_requested',
        entityId: 'cred-1',
      }),
    );
  });

  it('rejects OWNER_ONLY requests', async () => {
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'hash' });
    prisma.credential.findFirst.mockResolvedValue({
      id: 'cred-1',
      name: 'Root',
      ownerId: null,
      projectId: null,
      confidentiality: 'OWNER_ONLY',
    });

    await expect(
      service.requestEmergencyAccess(
        'cred-1',
        { reason: 'Need the master secret', stepUpPassword: 'pwd' },
        accessUser1,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when caller already has visibility', async () => {
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'hash' });
    prisma.credential.findFirst
      .mockResolvedValueOnce({
        id: 'cred-1',
        name: 'Prod DB',
        ownerId: null,
        projectId: null,
        confidentiality: 'NORMAL',
      })
      .mockResolvedValueOnce({ id: 'cred-1' });

    await expect(
      service.requestEmergencyAccess(
        'cred-1',
        { reason: 'Should not apply', stepUpPassword: 'pwd' },
        accessUser1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approves a pending request, grants VIEW, and audits', async () => {
    prisma.employee.findUnique.mockResolvedValue({ passwordHash: 'hash' });
    prisma.credentialEmergencyAccessRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      credentialId: 'cred-1',
      requesterId: 'user-1',
      reason: 'Outage',
      ttlMs: 86_400_000,
      status: 'PENDING',
      credential: {
        id: 'cred-1',
        name: 'Prod DB',
        ownerId: 'owner-1',
        projectId: 'p1',
        confidentiality: 'NORMAL',
      },
    });
    prisma.resourceAccessGrant.upsert.mockResolvedValue({ id: 'grant-1' });

    const result = await service.decideEmergencyAccess('req-1', 'APPROVED', accessOwnerAll, 'pwd');

    expect(result.status).toBe('APPROVED');
    expect(prisma.resourceAccessGrant.upsert).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.emergency_access_approved' }),
    );
  });

  it('forbids non-founders from listing pending requests', async () => {
    await expect(service.listEmergencyAccessRequests(accessUser1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
