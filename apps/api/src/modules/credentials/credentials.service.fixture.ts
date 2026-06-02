import { vi } from 'vitest';
import { CredentialsService } from './credentials.service';
import { AuditService } from '../audit/audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

vi.mock('../../common/utils/crypto', () => ({
  encrypt: vi.fn((text: string) => `enc:tag:${text}`),
  decrypt: vi.fn((text: string) => text.replace('enc:tag:', '')),
}));
vi.mock('argon2', () => ({
  default: { verify: vi.fn(async () => true) },
  verify: vi.fn(async () => true),
}));

export const TEST_KEY = 'test-key-for-credentials';
export const accessUser1 = { employeeId: 'user-1', departmentIds: [] as string[] };
export const accessOwnerAll = {
  employeeId: 'owner-1',
  departmentIds: [] as string[],
  viewScope: 'ALL',
  editScope: 'ALL',
  deleteScope: 'ALL',
};

export function createCredentialsServiceTestContext() {
  const prisma = createMockPrisma();
  const auditService = {
    log: vi.fn(),
    findByEntity: vi.fn().mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
    }),
  };
  const notifications = { create: vi.fn() };
  const configService = {
    get: vi.fn((key: string) => (key === 'CREDENTIALS_ENCRYPTION_KEY' ? TEST_KEY : undefined)),
  };
  Object.assign(prisma, {
    resourceAccessGrant: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      upsert: vi.fn().mockResolvedValue({}),
      create: vi.fn(),
      update: vi.fn(),
    },
    credentialSecretVersion: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  });
  const service = new CredentialsService(
    prisma as never,
    configService as never,
    auditService as never,
    notifications as never,
    {
      loadTeamContext: vi.fn().mockResolvedValue({
        projectIds: [],
        productIds: [],
        projectAdminProjectIds: [],
      }),
    } as never,
  );
  return {
    service,
    prisma: prisma as MockPrisma,
    auditService: auditService as Pick<AuditService, 'log'>,
    notifications,
  };
}
