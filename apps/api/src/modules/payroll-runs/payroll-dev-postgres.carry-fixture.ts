import { Decimal, type PrismaClient } from '@nbos/database';

import { PAYROLL_DEV_MARKER, type DevPayrollIds } from './payroll-dev-postgres.ids';
import { claimPayrollMonths, seedPeopleAndCrm } from './payroll-dev-postgres.seed';

export const CARRY_APRIL_INCLUDED = '40000.00';
export const CARRY_APRIL_ORIGINAL = '100000.00';
export const CARRY_APRIL_REMAINING = '60000.00';
export const CARRY_MAY_INCLUDED = '30000.00';
export const CARRY_MAY_ORIGINAL = '50000.00';
export const CARRY_MAY_REMAINING = '30000.00';
export const CARRY_JUNE_APPLIED = '50000.00';
export const CARRY_TINY = '1.00';

export type CarryChainIds = DevPayrollIds & {
  oldestRunId: string;
  middleRunId?: string;
  newestRunId: string;
  oldestReleaseId: string;
  middleReleaseId?: string;
  tinyReleaseId: string;
};

export async function seedClosedCarryChain(prisma: PrismaClient): Promise<CarryChainIds> {
  const ids = await seedPeopleAndCrm(prisma);
  const [oldest, newest] = await claimPayrollMonths(prisma, 2);
  if (!oldest || !newest) {
    throw new Error('closed carry chain needs two months');
  }
  const employeeId = requireEmployee(ids);
  const oldestRunId = await createCarryRun(prisma, ids, oldest, 'CLOSED', employeeId);
  const newestRunId = await createCarryRun(prisma, ids, newest, 'REVIEW', employeeId);
  const oldestReleaseId = await createCarryRelease(prisma, ids, {
    employeeId,
    runId: oldestRunId,
    included: CARRY_APRIL_INCLUDED,
    carry: CARRY_APRIL_ORIGINAL,
    remaining: CARRY_APRIL_REMAINING,
    salaryBonus: CARRY_APRIL_INCLUDED,
  });
  const tinyReleaseId = await createTinyRelease(prisma, ids, {
    employeeId,
    runId: newestRunId,
    carryApplied: CARRY_APRIL_INCLUDED,
  });
  return { ...ids, oldestRunId, newestRunId, oldestReleaseId, tinyReleaseId };
}

export async function seedOpenCarryChain(prisma: PrismaClient): Promise<CarryChainIds> {
  const ids = await seedPeopleAndCrm(prisma);
  const months = (await claimPayrollMonths(prisma, 3)).slice().sort();
  const [oldest, middle, newest] = months;
  if (!oldest || !middle || !newest) {
    throw new Error('open carry chain needs three months');
  }
  const employeeId = requireEmployee(ids);
  const oldestRunId = await createCarryRun(prisma, ids, oldest, 'REVIEW', employeeId);
  const middleRunId = await createCarryRun(prisma, ids, middle, 'REVIEW', employeeId);
  const newestRunId = await createCarryRun(prisma, ids, newest, 'REVIEW', employeeId);
  const oldestReleaseId = await createCarryRelease(prisma, ids, {
    employeeId,
    runId: oldestRunId,
    included: CARRY_APRIL_INCLUDED,
    carry: CARRY_APRIL_ORIGINAL,
    remaining: CARRY_APRIL_REMAINING,
    salaryBonus: CARRY_APRIL_INCLUDED,
  });
  const middleReleaseId = await createCarryRelease(prisma, ids, {
    employeeId,
    runId: middleRunId,
    included: CARRY_MAY_INCLUDED,
    carry: CARRY_MAY_ORIGINAL,
    remaining: CARRY_MAY_REMAINING,
    salaryBonus: CARRY_MAY_INCLUDED,
  });
  const tinyReleaseId = await createTinyRelease(prisma, ids, {
    employeeId,
    runId: newestRunId,
    carryApplied: CARRY_JUNE_APPLIED,
  });
  return {
    ...ids,
    oldestRunId,
    middleRunId,
    newestRunId,
    oldestReleaseId,
    middleReleaseId,
    tinyReleaseId,
  };
}

async function createCarryRun(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  month: string,
  status: 'REVIEW' | 'CLOSED',
  employeeId: string,
): Promise<string> {
  const run = await prisma.payrollRun.create({
    data: {
      payrollMonth: month,
      status,
      createdById: employeeId,
      totalPayable: new Decimal(0),
    },
    select: { id: true },
  });
  ids.payrollRunIds.push(run.id);
  return run.id;
}

async function createCarryRelease(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  input: {
    employeeId: string;
    runId: string;
    included: string;
    carry: string;
    remaining: string;
    salaryBonus: string;
  },
): Promise<string> {
  const entryId = await createEntry(prisma, ids, input.employeeId, input.carry);
  const release = await prisma.bonusRelease.create({
    data: {
      bonusEntryId: entryId,
      payrollRunId: input.runId,
      employeeId: input.employeeId,
      projectId: requireProject(ids),
      amount: new Decimal(input.included).plus(input.carry),
      payrollIncludedAmount: new Decimal(input.included),
      payrollCarryOverAmount: new Decimal(input.carry),
      payrollCarryOverRemaining: new Decimal(input.remaining),
      releaseType: 'MANUAL',
      status: 'INCLUDED_IN_PAYROLL',
      reason: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.releaseIds.push(release.id);
  await prisma.salaryLine.create({
    data: {
      payrollRunId: input.runId,
      employeeId: input.employeeId,
      baseSalary: new Decimal(0),
      bonusesTotal: new Decimal(input.salaryBonus),
      totalPayable: new Decimal(input.salaryBonus),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(input.salaryBonus),
      status: 'PENDING',
    },
  });
  return release.id;
}

async function createTinyRelease(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  input: { employeeId: string; runId: string; carryApplied: string },
): Promise<string> {
  const bonus = new Decimal(input.carryApplied).plus(CARRY_TINY);
  const entryId = await createEntry(prisma, ids, input.employeeId, CARRY_TINY);
  const release = await prisma.bonusRelease.create({
    data: {
      bonusEntryId: entryId,
      payrollRunId: input.runId,
      employeeId: input.employeeId,
      projectId: requireProject(ids),
      amount: new Decimal(CARRY_TINY),
      payrollIncludedAmount: new Decimal(CARRY_TINY),
      releaseType: 'MANUAL',
      status: 'INCLUDED_IN_PAYROLL',
      reason: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
  ids.releaseIds.push(release.id);
  await prisma.salaryLine.create({
    data: {
      payrollRunId: input.runId,
      employeeId: input.employeeId,
      baseSalary: new Decimal(0),
      bonusesTotal: bonus,
      totalPayable: bonus,
      paidAmount: new Decimal(0),
      remainingAmount: bonus,
      payrollCarryAppliedAmount: new Decimal(input.carryApplied),
      status: 'PENDING',
    },
  });
  return release.id;
}

async function createEntry(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
  amount: string,
): Promise<string> {
  const entry = await prisma.bonusEntry.create({
    data: {
      employeeId,
      orderId: requireOrder(ids),
      projectId: requireProject(ids),
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

function requireEmployee(ids: DevPayrollIds): string {
  const id = ids.employeeIds[0];
  if (!id) throw new Error('carry fixture missing employee');
  return id;
}

function requireProject(ids: DevPayrollIds): string {
  if (!ids.projectId) throw new Error('carry fixture missing project');
  return ids.projectId;
}

function requireOrder(ids: DevPayrollIds): string {
  if (!ids.orderId) throw new Error('carry fixture missing order');
  return ids.orderId;
}
