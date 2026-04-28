import { vi } from 'vitest';

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'test-id', ...data })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'test-id', ...data })),
    upsert: vi
      .fn()
      .mockImplementation(({ create }) => Promise.resolve({ id: 'test-id', ...create })),
    delete: vi.fn().mockResolvedValue({ id: 'test-id' }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
  };
}

export function createMockPrisma() {
  return {
    lead: createModelMock(),
    deal: createModelMock(),
    project: createModelMock(),
    projectKickoffChecklistItem: createModelMock(),
    contact: createModelMock(),
    company: createModelMock(),
    order: createModelMock(),
    invoice: createModelMock(),
    employee: createModelMock(),
    payment: createModelMock(),
    product: createModelMock(),
    extension: createModelMock(),
    subscription: createModelMock(),
    task: createModelMock(),
    supportTicket: createModelMock(),
    expense: createModelMock(),
    bonusEntry: createModelMock(),
    credential: createModelMock(),
    auditLog: createModelMock(),
    partner: createModelMock(),
    marketingAccount: createModelMock(),
    marketingActivity: createModelMock(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
