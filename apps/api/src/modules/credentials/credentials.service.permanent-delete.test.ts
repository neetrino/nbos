import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService permanent delete step-up', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
  });

  it('requires step-up password for CRITICAL archived credentials', async () => {
    prisma.credential.findFirst.mockResolvedValue({
      id: '1',
      projectId: null,
      criticality: 'CRITICAL',
      archivedAt: new Date(),
    });
    await expect(service.permanentlyDelete('1', accessUser1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.credential.delete).not.toHaveBeenCalled();
  });
});
