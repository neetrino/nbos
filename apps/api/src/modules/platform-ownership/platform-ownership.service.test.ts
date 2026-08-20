import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OWNERSHIP_TRANSFER_CONFIRMATION } from '@nbos/shared';
import { PlatformOwnershipService } from './platform-ownership.service';

const FOUNDER_ID = '14b22deb-5998-4bb5-aabe-f3ad5a0a6ff6';

function createService() {
  const prisma = {
    platformOwnership: {
      findUnique: vi.fn().mockResolvedValue({ ownerEmployeeId: FOUNDER_ID }),
      update: vi.fn(),
    },
    employee: {
      findUnique: vi.fn().mockResolvedValue({ id: FOUNDER_ID, status: 'ACTIVE' }),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  };
  const config = {
    get: vi.fn((key: string) => (key === 'NBOS_FOUNDER_EMPLOYEE_ID' ? FOUNDER_ID : undefined)),
  };
  const audit = { log: vi.fn() };
  const notifications = { createMany: vi.fn() };
  const authSessions = { revokeAllSessions: vi.fn() };
  const service = new PlatformOwnershipService(
    prisma as never,
    config as never,
    audit as never,
    notifications as never,
    authSessions as never,
  );
  return { service, prisma, audit };
}

describe('PlatformOwnershipService transfer', () => {
  let service: PlatformOwnershipService;
  let audit: { log: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const ctx = createService();
    service = ctx.service;
    audit = ctx.audit;
  });

  it('12. rejects transfer without step-up', async () => {
    await expect(
      service.transfer({
        actorId: FOUNDER_ID,
        targetEmployeeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        confirm: OWNERSHIP_TRANSFER_CONFIRMATION,
        stepUpVerified: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('10. audits integrity failure when env mismatches', async () => {
    const prisma = {
      platformOwnership: {
        findUnique: vi.fn().mockResolvedValue({ ownerEmployeeId: FOUNDER_ID }),
      },
      employee: {
        findUnique: vi.fn().mockResolvedValue({ id: FOUNDER_ID, status: 'ACTIVE' }),
      },
    };
    const serviceMismatch = new PlatformOwnershipService(
      prisma as never,
      { get: vi.fn(() => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') } as never,
      audit as never,
      { createMany: vi.fn() } as never,
      { revokeAllSessions: vi.fn() } as never,
    );
    await expect(serviceMismatch.assertPlatformOwner(FOUNDER_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'platform.ownership_integrity_failed' }),
    );
  });
});
