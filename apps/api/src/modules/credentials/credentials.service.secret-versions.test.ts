import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService secret versions', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
  });

  it('lists secret version metadata without ciphertext', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: 'cred-1', projectId: null });
    prisma.credentialSecretVersion.findMany.mockResolvedValue([
      {
        id: 'v1',
        field: 'password',
        versionNumber: 1,
        rotatedAt: new Date('2026-01-01'),
        source: 'MANUAL',
        reason: 'Rotated',
        rotatedBy: { id: 'u1', firstName: 'A', lastName: 'B' },
      },
    ]);

    const result = await service.listSecretVersions('cred-1', accessUser1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.field).toBe('password');
  });

  it('rejects version reveal for non-executive without ALL scope', async () => {
    prisma.credential.findFirst.mockResolvedValue({ id: 'cred-1', projectId: null });
    prisma.employee.findUnique.mockResolvedValue({ role: { slug: 'developer' } });

    await expect(
      service.revealSecretVersion('cred-1', 'v1', 'pwd', accessUser1),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
