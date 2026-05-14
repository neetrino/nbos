import { vi } from 'vitest';

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'test-id', ...data })),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'test-id', ...data })),
    upsert: vi
      .fn()
      .mockImplementation(({ create }) => Promise.resolve({ id: 'test-id', ...create })),
    delete: vi.fn().mockResolvedValue({ id: 'test-id' }),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
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
    contact: createModelMock(),
    company: createModelMock(),
    order: createModelMock(),
    invoice: createModelMock(),
    employee: createModelMock(),
    employeeDepartment: createModelMock(),
    payment: createModelMock(),
    product: createModelMock(),
    extension: createModelMock(),
    checklistInstance: createModelMock(),
    subscription: createModelMock(),
    workSpace: createModelMock(),
    task: createModelMock(),
    recurringTaskTemplate: createModelMock(),
    taskLink: createModelMock(),
    fileAsset: createModelMock(),
    fileVersion: createModelMock(),
    fileLink: createModelMock(),
    fileAuditEvent: createModelMock(),
    fileUploadSession: createModelMock(),
    driveFolder: createModelMock(),
    driveFolderItem: createModelMock(),
    reportExportJob: createModelMock(),
    driveZipExportJob: createModelMock(),
    reportSchedule: createModelMock(),
    savedReportView: createModelMock(),
    dashboardPreference: createModelMock(),
    personalLink: createModelMock(),
    dashboardNote: createModelMock(),
    documentSection: createModelMock(),
    externalDocumentLink: createModelMock(),
    document: createModelMock(),
    documentTag: createModelMock(),
    documentTagOnDocument: createModelMock(),
    documentAttachment: createModelMock(),
    documentActivityEvent: createModelMock(),
    technicalAsset: createModelMock(),
    technicalEnvironment: createModelMock(),
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
    partnerCommissionPolicyRow: createModelMock(),
    partnerReferralTerms: createModelMock(),
    partnerAccrual: createModelMock(),
    partnerPayoutBatch: createModelMock(),
    partnerServiceTerm: createModelMock(),
    marketingAccount: createModelMock(),
    marketingActivity: createModelMock(),
    marketingCrmWhereOption: createModelMock(),
    salesBonusPolicy: createModelMock(),
    productBonusPool: createModelMock(),
    bonusRelease: createModelMock(),
    financePostingPeriod: createModelMock(),
    operationalJournalEntry: createModelMock(),
    notificationEvent: createModelMock(),
    notificationRule: createModelMock(),
    notificationJob: createModelMock(),
    notificationDelivery: createModelMock(),
    inAppNotification: createModelMock(),
    calendarMeeting: createModelMock(),
    personalCalendarEvent: createModelMock(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === 'function') {
      return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
    }
    return undefined;
  });

  return prisma;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
