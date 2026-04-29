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
  const prisma = {
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
    workSpace: createModelMock(),
    task: createModelMock(),
    fileAsset: createModelMock(),
    fileVersion: createModelMock(),
    fileLink: createModelMock(),
    fileAuditEvent: createModelMock(),
    fileUploadSession: createModelMock(),
    documentSection: createModelMock(),
    externalDocumentLink: createModelMock(),
    document: createModelMock(),
    documentTag: createModelMock(),
    documentTagOnDocument: createModelMock(),
    documentAttachment: createModelMock(),
    documentActivityEvent: createModelMock(),
    supportTicket: createModelMock(),
    expense: createModelMock(),
    expensePlan: createModelMock(),
    clientServiceRecord: createModelMock(),
    expensePayment: createModelMock(),
    bonusEntry: createModelMock(),
    payrollRun: createModelMock(),
    salaryLine: createModelMock(),
    credential: createModelMock(),
    auditLog: createModelMock(),
    partner: createModelMock(),
    marketingAccount: createModelMock(),
    marketingActivity: createModelMock(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
