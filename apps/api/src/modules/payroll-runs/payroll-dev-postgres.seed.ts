import { randomUUID } from 'node:crypto';

import { Decimal, type PrismaClient } from '@nbos/database';

import { deleteDevPayrollGraph } from './payroll-dev-postgres.cleanup';
import { seedCrmGraph } from './payroll-dev-postgres.crm';
import {
  APPROVAL_SALARY_AMD,
  BONUS_AMD,
  emptyDevPayrollIds,
  PAYROLL_DEV_MARKER,
  PAYROLL_DEV_PREFIX,
  SALARY_AMD,
  type DevPayrollIds,
} from './payroll-dev-postgres.ids';

const PROFILE_START = new Date('2094-01-01T00:00:00.000Z');

export async function claimPayrollMonths(prisma: PrismaClient, count: number): Promise<string[]> {
  const free: string[] = [];
  for (let year = 2091; year <= 2096 && free.length < count; year += 1) {
    for (let month = 1; month <= 12 && free.length < count; month += 1) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const existing = await prisma.payrollRun.findUnique({
        where: { payrollMonth: key },
        select: { id: true },
      });
      if (!existing) {
        free.push(key);
      }
    }
  }
  if (free.length < count) {
    throw new Error(`Need ${count} free synthetic payroll months, found ${free.length}`);
  }
  return free;
}

export async function seedPayrollCashGraph(prisma: PrismaClient): Promise<DevPayrollIds> {
  const ids = await seedPeopleAndCrm(prisma);
  try {
    const [month] = await claimPayrollMonths(prisma, 1);
    const employeeId = ids.employeeIds[0];
    if (!month || !employeeId || !ids.projectId || !ids.orderId) {
      throw new Error('Payroll cash graph is missing people or a month');
    }
    await seedCashPayroll(prisma, ids, month, employeeId);
    return ids;
  } catch (error) {
    await deleteDevPayrollGraph(prisma, ids);
    throw error;
  }
}

export async function seedPayrollApprovalGraph(prisma: PrismaClient): Promise<DevPayrollIds> {
  const ids = await seedPeopleAndCrm(prisma);
  try {
    const [month] = await claimPayrollMonths(prisma, 1);
    const employeeId = ids.employeeIds[0];
    if (!month || !employeeId) {
      throw new Error('Payroll approval graph is missing an employee or a month');
    }
    await seedApprovalPayroll(prisma, ids, month, employeeId);
    return ids;
  } catch (error) {
    await deleteDevPayrollGraph(prisma, ids);
    throw error;
  }
}

export async function seedPeopleAndCrm(prisma: PrismaClient): Promise<DevPayrollIds> {
  const ids = emptyDevPayrollIds(randomUUID().replaceAll('-', '').slice(0, 12));
  const role = await prisma.role.create({
    data: {
      name: `${PAYROLL_DEV_PREFIX} role ${ids.runToken}`,
      slug: `${PAYROLL_DEV_PREFIX}-role-${ids.runToken}`.toLowerCase(),
      level: 1,
      description: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.roleId = role.id;
  const employee = await prisma.employee.create({
    data: {
      firstName: 'Dev',
      lastName: `Pay ${ids.runToken}`,
      email: `${PAYROLL_DEV_PREFIX}-${ids.runToken}@nbos.invalid`.toLowerCase(),
      roleId: role.id,
      notes: PAYROLL_DEV_MARKER,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  ids.employeeIds.push(employee.id);
  await seedCrmGraph(prisma, ids, employee.id);
  return ids;
}

async function seedCashPayroll(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  month: string,
  employeeId: string,
): Promise<void> {
  const profileId = await createProfile(prisma, ids, employeeId, SALARY_AMD);
  const runId = await createRun(prisma, ids, month, 'APPROVED', employeeId);
  const entryId = await createDeliveryEntry(prisma, ids, employeeId, BONUS_AMD);
  const release = await prisma.bonusRelease.create({
    data: {
      bonusEntryId: entryId,
      payrollRunId: runId,
      employeeId,
      projectId: requireId(ids.projectId, 'project'),
      amount: new Decimal(BONUS_AMD),
      payrollIncludedAmount: new Decimal(BONUS_AMD),
      releaseType: 'MANUAL',
      status: 'INCLUDED_IN_PAYROLL',
      reason: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.releaseIds.push(release.id);
  await linkCashExpense(prisma, ids, month, employeeId, profileId, runId);
}

async function linkCashExpense(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  month: string,
  employeeId: string,
  profileId: string,
  runId: string,
): Promise<void> {
  const expense = await prisma.expense.create({
    data: {
      name: `Payroll ${month} ${ids.runToken}`,
      type: 'PLANNED',
      category: 'SALARY',
      amount: new Decimal(SALARY_AMD).plus(BONUS_AMD),
      frequency: 'ONE_TIME',
      status: 'DUE_NOW',
      notes: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.expenseIds.push(expense.id);
  await prisma.salaryLine.create({
    data: {
      payrollRunId: runId,
      employeeId,
      compensationProfileId: profileId,
      baseSalary: new Decimal(SALARY_AMD),
      bonusesTotal: new Decimal(BONUS_AMD),
      totalPayable: new Decimal(SALARY_AMD).plus(BONUS_AMD),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(SALARY_AMD).plus(BONUS_AMD),
      status: 'APPROVED',
      expenseId: expense.id,
    },
  });
}

async function seedApprovalPayroll(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  month: string,
  employeeId: string,
): Promise<void> {
  const profileId = await createProfile(prisma, ids, employeeId, APPROVAL_SALARY_AMD);
  const runId = await createRun(prisma, ids, month, 'REVIEW', employeeId);
  await prisma.salaryLine.create({
    data: {
      payrollRunId: runId,
      employeeId,
      compensationProfileId: profileId,
      baseSalary: new Decimal(APPROVAL_SALARY_AMD),
      bonusesTotal: new Decimal(0),
      totalPayable: new Decimal(APPROVAL_SALARY_AMD),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(APPROVAL_SALARY_AMD),
      status: 'PENDING',
    },
  });
}

async function createProfile(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
  salary: string,
): Promise<string> {
  const profile = await prisma.compensationProfile.create({
    data: {
      employeeId,
      baseSalary: new Decimal(salary),
      currency: 'AMD',
      effectiveFrom: PROFILE_START,
      status: 'ACTIVE',
      notes: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.profileIds.push(profile.id);
  return profile.id;
}

async function createRun(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  month: string,
  status: 'APPROVED' | 'REVIEW',
  employeeId: string,
): Promise<string> {
  const run = await prisma.payrollRun.create({
    data: {
      payrollMonth: month,
      status,
      totalBaseSalary: new Decimal(status === 'APPROVED' ? SALARY_AMD : APPROVAL_SALARY_AMD),
      totalBonuses: new Decimal(status === 'APPROVED' ? BONUS_AMD : 0),
      totalPayable: new Decimal(status === 'APPROVED' ? '360000.00' : APPROVAL_SALARY_AMD),
      totalPaid: new Decimal(0),
      createdById: employeeId,
      approvedById: status === 'APPROVED' ? employeeId : null,
    },
    select: { id: true },
  });
  ids.payrollRunIds.push(run.id);
  return run.id;
}

async function createDeliveryEntry(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
  amount: string,
): Promise<string> {
  const entry = await prisma.bonusEntry.create({
    data: {
      employeeId,
      orderId: requireId(ids.orderId, 'order'),
      projectId: requireId(ids.projectId, 'project'),
      type: 'DELIVERY',
      amount: new Decimal(amount),
      percent: new Decimal(0),
      status: 'ACTIVE',
      title: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.entryIds.push(entry.id);
  return entry.id;
}

function requireId(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(`Dev payroll fixture missing ${label}`);
  }
  return id;
}
