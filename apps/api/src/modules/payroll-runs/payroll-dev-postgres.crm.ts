import { Decimal, type PrismaClient } from '@nbos/database';

import {
  PAYROLL_DEV_MARKER,
  PAYROLL_DEV_PREFIX,
  SALARY_AMD,
  type DevPayrollIds,
} from './payroll-dev-postgres.ids';

export async function seedCrmGraph(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
): Promise<void> {
  const contactId = await createContact(prisma, ids);
  const companyId = await createCompany(prisma, ids, contactId);
  const projectId = await createProject(prisma, ids, contactId, companyId);
  await createDealAndOrder(prisma, ids, employeeId, companyId, projectId);
}

async function createContact(prisma: PrismaClient, ids: DevPayrollIds): Promise<string> {
  const contact = await prisma.contact.create({
    data: { firstName: 'Dev', lastName: `Pay ${ids.runToken}`, notes: PAYROLL_DEV_MARKER },
    select: { id: true },
  });
  ids.contactId = contact.id;
  return contact.id;
}

async function createCompany(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  contactId: string,
): Promise<string> {
  const company = await prisma.company.create({
    data: {
      name: `${PAYROLL_DEV_PREFIX} ${ids.runToken}`,
      taxStatus: 'TAX_FREE',
      notes: PAYROLL_DEV_MARKER,
      contactId,
    },
    select: { id: true },
  });
  ids.companyId = company.id;
  return company.id;
}

async function createProject(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  contactId: string,
  companyId: string,
): Promise<string> {
  const project = await prisma.project.create({
    data: {
      code: `${PAYROLL_DEV_PREFIX}-P-${ids.runToken}`,
      name: `${PAYROLL_DEV_PREFIX} project ${ids.runToken}`,
      contactId,
      companyId,
      description: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.projectId = project.id;
  return project.id;
}

async function createDealAndOrder(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
  companyId: string,
  projectId: string,
): Promise<void> {
  const deal = await prisma.deal.create({
    data: {
      code: `${PAYROLL_DEV_PREFIX}-D-${ids.runToken}`,
      name: `${PAYROLL_DEV_PREFIX} deal ${ids.runToken}`,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      taxStatus: 'TAX_FREE',
      sellerId: employeeId,
      companyId,
      projectId,
      amount: new Decimal(SALARY_AMD),
      notes: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.dealId = deal.id;
  const order = await prisma.order.create({
    data: {
      code: `${PAYROLL_DEV_PREFIX}-O-${ids.runToken}`,
      projectId,
      dealId: deal.id,
      type: 'PRODUCT',
      paymentType: 'CLASSIC',
      totalAmount: new Decimal(SALARY_AMD),
      taxStatus: 'TAX_FREE',
      notes: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.orderId = order.id;
}
