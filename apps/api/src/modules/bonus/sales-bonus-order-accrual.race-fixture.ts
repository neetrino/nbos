import { randomUUID } from 'node:crypto';

import { Decimal, type PrismaClient } from '@nbos/database';

export const V13_RACE_MARKER = 'nbos:dev-synthetic:v13-race';
export const V13_RACE_CODE_PREFIX = 'DEV-V13-RACE';
export const V13_RACE_EARNED_PERIOD = '2099-01';
export const V13_OVER_CAP_BASE_AMD = new Decimal('4000000');
export const V13_SELLER_PERCENT = new Decimal('8');
export const V13_ASSISTANT_PERCENT = new Decimal('2');

const INVOICE_FACE_AMD = new Decimal('100.00');
const INVOICE_DUE_AT = new Date('2099-12-31T00:00:00.000Z');

export type V13RaceFixture = {
  runToken: string;
  roleId?: string;
  sellerId?: string;
  assistantId?: string;
  contactId?: string;
  companyId?: string;
  projectId?: string;
  dealId?: string;
  orderId?: string;
  invoiceAId?: string;
  invoiceBId?: string;
};

export function emptyV13RaceFixture(): V13RaceFixture {
  return { runToken: randomUUID().replaceAll('-', '').slice(0, 12) };
}

export async function seedV13RaceGraph(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
): Promise<void> {
  await seedPeople(prisma, fixture);
  await seedCrm(prisma, fixture);
  await seedFinance(prisma, fixture);
}

export async function deleteV13RaceGraph(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
): Promise<void> {
  if (fixture.orderId) {
    await prisma.bonusEntry.deleteMany({ where: { orderId: fixture.orderId } });
  }
  const invoiceIds = compactIds([fixture.invoiceAId, fixture.invoiceBId]);
  if (invoiceIds.length > 0) {
    await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
  }
  await deleteById(prisma.order, fixture.orderId);
  await deleteById(prisma.deal, fixture.dealId);
  await deleteById(prisma.project, fixture.projectId);
  await deleteById(prisma.company, fixture.companyId);
  await deleteById(prisma.contact, fixture.contactId);
  const employeeIds = compactIds([fixture.sellerId, fixture.assistantId]);
  if (employeeIds.length > 0) {
    await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } });
  }
  await deleteById(prisma.role, fixture.roleId);
  const leftovers = await listV13RaceLeftovers(prisma, fixture);
  if (leftovers.length > 0) {
    throw new Error(
      `V-13 race cleanup left rows: ${leftovers.join(', ')}; ids=${JSON.stringify(fixture)}`,
    );
  }
}

export async function listV13RaceLeftovers(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
): Promise<string[]> {
  const leftover: string[] = [];
  if (fixture.orderId) {
    const bonusCount = await prisma.bonusEntry.count({ where: { orderId: fixture.orderId } });
    if (bonusCount > 0) {
      leftover.push(`bonusEntry:${fixture.orderId}`);
    }
  }
  await pushIfPresent(leftover, 'invoiceA', fixture.invoiceAId, (id) =>
    prisma.invoice.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'invoiceB', fixture.invoiceBId, (id) =>
    prisma.invoice.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'order', fixture.orderId, (id) =>
    prisma.order.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'deal', fixture.dealId, (id) =>
    prisma.deal.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'project', fixture.projectId, (id) =>
    prisma.project.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'company', fixture.companyId, (id) =>
    prisma.company.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'contact', fixture.contactId, (id) =>
    prisma.contact.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'seller', fixture.sellerId, (id) =>
    prisma.employee.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'assistant', fixture.assistantId, (id) =>
    prisma.employee.count({ where: { id } }),
  );
  await pushIfPresent(leftover, 'role', fixture.roleId, (id) =>
    prisma.role.count({ where: { id } }),
  );
  return leftover;
}

async function seedPeople(prisma: PrismaClient, fixture: V13RaceFixture): Promise<void> {
  const role = await prisma.role.create({
    data: {
      name: `${V13_RACE_CODE_PREFIX} role ${fixture.runToken}`,
      slug: `${V13_RACE_CODE_PREFIX}-role-${fixture.runToken}`.toLowerCase(),
      level: 1,
      description: V13_RACE_MARKER,
    },
    select: { id: true },
  });
  fixture.roleId = role.id;
  const seller = await createRaceEmployee(prisma, fixture, 'seller');
  const assistant = await createRaceEmployee(prisma, fixture, 'assistant');
  fixture.sellerId = seller.id;
  fixture.assistantId = assistant.id;
}

async function seedCrm(prisma: PrismaClient, fixture: V13RaceFixture): Promise<void> {
  const contact = await prisma.contact.create({
    data: {
      firstName: 'V13',
      lastName: `Race ${fixture.runToken}`,
      notes: V13_RACE_MARKER,
    },
    select: { id: true },
  });
  fixture.contactId = contact.id;
  const company = await prisma.company.create({
    data: {
      name: `${V13_RACE_CODE_PREFIX} ${fixture.runToken}`,
      taxStatus: 'TAX_FREE',
      notes: V13_RACE_MARKER,
      contactId: contact.id,
    },
    select: { id: true },
  });
  fixture.companyId = company.id;
  const project = await prisma.project.create({
    data: {
      code: `${V13_RACE_CODE_PREFIX}-P-${fixture.runToken}`,
      name: `${V13_RACE_CODE_PREFIX} project ${fixture.runToken}`,
      contactId: contact.id,
      companyId: company.id,
      description: V13_RACE_MARKER,
    },
    select: { id: true },
  });
  fixture.projectId = project.id;
}

async function seedFinance(prisma: PrismaClient, fixture: V13RaceFixture): Promise<void> {
  if (!fixture.sellerId || !fixture.assistantId || !fixture.projectId || !fixture.companyId) {
    throw new Error('V-13 race CRM rows missing before finance seed');
  }
  const deal = await prisma.deal.create({
    data: {
      code: `${V13_RACE_CODE_PREFIX}-D-${fixture.runToken}`,
      name: `${V13_RACE_CODE_PREFIX} deal ${fixture.runToken}`,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      taxStatus: 'TAX_FREE',
      sellerId: fixture.sellerId,
      sellerAssistantId: fixture.assistantId,
      companyId: fixture.companyId,
      projectId: fixture.projectId,
      amount: V13_OVER_CAP_BASE_AMD,
      notes: V13_RACE_MARKER,
    },
    select: { id: true },
  });
  fixture.dealId = deal.id;
  const order = await prisma.order.create({
    data: {
      code: `${V13_RACE_CODE_PREFIX}-O-${fixture.runToken}`,
      projectId: fixture.projectId,
      dealId: deal.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: V13_OVER_CAP_BASE_AMD,
      taxStatus: 'TAX_FREE',
      notes: V13_RACE_MARKER,
    },
    select: { id: true },
  });
  fixture.orderId = order.id;
  fixture.invoiceAId = (await createRaceInvoice(prisma, fixture, 'A')).id;
  fixture.invoiceBId = (await createRaceInvoice(prisma, fixture, 'B')).id;
}

async function createRaceEmployee(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
  suffix: 'seller' | 'assistant',
): Promise<{ id: string }> {
  if (!fixture.roleId) {
    throw new Error('V-13 race role missing before employee seed');
  }
  return prisma.employee.create({
    data: {
      firstName: 'V13',
      lastName: `${suffix} ${fixture.runToken}`,
      email: `${V13_RACE_CODE_PREFIX}-${suffix}-${fixture.runToken}@nbos.invalid`.toLowerCase(),
      roleId: fixture.roleId,
      notes: V13_RACE_MARKER,
      status: 'PROBATION',
    },
    select: { id: true },
  });
}

async function createRaceInvoice(
  prisma: PrismaClient,
  fixture: V13RaceFixture,
  label: 'A' | 'B',
): Promise<{ id: string }> {
  if (!fixture.orderId || !fixture.projectId || !fixture.companyId) {
    throw new Error('V-13 race order missing before invoice seed');
  }
  return prisma.invoice.create({
    data: {
      code: `${V13_RACE_CODE_PREFIX}-I${label}-${fixture.runToken}`,
      orderId: fixture.orderId,
      projectId: fixture.projectId,
      companyId: fixture.companyId,
      amount: INVOICE_FACE_AMD,
      taxStatus: 'TAX_FREE',
      type: 'MANUAL',
      moneyStatus: 'NEW',
      dueDate: INVOICE_DUE_AT,
      officialInvoiceRequestSent: false,
      notificationsEnabled: false,
      notes: V13_RACE_MARKER,
    },
    select: { id: true },
  });
}

async function deleteById(
  delegate: { deleteMany: (args: { where: { id: string } }) => Promise<unknown> },
  id: string | undefined,
): Promise<void> {
  if (!id) {
    return;
  }
  await delegate.deleteMany({ where: { id } });
}

function compactIds(ids: Array<string | undefined>): string[] {
  return ids.filter((id): id is string => id != null);
}

async function pushIfPresent(
  leftover: string[],
  label: string,
  id: string | undefined,
  count: (id: string) => Promise<number>,
): Promise<void> {
  if (!id) {
    return;
  }
  if ((await count(id)) > 0) {
    leftover.push(`${label}:${id}`);
  }
}
