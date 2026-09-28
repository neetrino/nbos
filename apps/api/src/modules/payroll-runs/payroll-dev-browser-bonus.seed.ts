import { randomUUID } from 'node:crypto';

import { Decimal, type PrismaClient } from '@nbos/database';

import {
  approvedProfileCoversPayrollMonth,
  endOfPayrollMonthUtc,
  startOfPayrollMonthUtc,
} from '../compensation-profiles/compensation-profile-payroll-month';
import { seedCrmGraph } from './payroll-dev-postgres.crm';
import { emptyDevPayrollIds, type DevPayrollIds } from './payroll-dev-postgres.ids';
import {
  BROWSER_BONUS_EARNED,
  BROWSER_BONUS_KPI_PLAN,
  BROWSER_BONUS_MARKER,
  BROWSER_BONUS_MONTH,
  BROWSER_BONUS_PART_A,
  BROWSER_BONUS_PART_B,
  BROWSER_BONUS_PREFIX,
} from './payroll-dev-browser-bonus.ids';
import { SALARY_AMD } from './payroll-dev-postgres.ids';

const APPROVED_PROFILE_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;

/** Creates the 2020-02 browser fixture once. Does not touch an existing payroll month. */
export async function prepareBrowserBonusFixture(prisma: PrismaClient): Promise<DevPayrollIds> {
  await assertMonthFree(prisma);
  await assertSeedWillNotFail(prisma);
  const existing = await prisma.employee.findFirst({
    where: { notes: BROWSER_BONUS_MARKER },
    select: { id: true },
  });
  if (existing) {
    return reloadExisting(prisma, existing.id);
  }
  return createBrowserBonusFixture(prisma);
}

async function assertMonthFree(prisma: PrismaClient): Promise<void> {
  const run = await prisma.payrollRun.findUnique({
    where: { payrollMonth: BROWSER_BONUS_MONTH },
    select: { id: true, status: true },
  });
  if (run) {
    throw new Error(`Payroll ${BROWSER_BONUS_MONTH} already exists (${run.status})`);
  }
}

async function assertSeedWillNotFail(prisma: PrismaClient): Promise<void> {
  const monthEnd = endOfPayrollMonthUtc(BROWSER_BONUS_MONTH);
  const employees = await prisma.employee.findMany({
    where: { status: { not: 'TERMINATED' }, notes: { not: BROWSER_BONUS_MARKER } },
    select: { id: true, firstName: true, lastName: true },
  });
  const profiles = await prisma.compensationProfile.findMany({
    where: { status: { in: [...APPROVED_PROFILE_STATUSES] } },
    select: { employeeId: true, effectiveFrom: true, effectiveTo: true },
  });
  const names = employees
    .filter((employee) => !hasLaterProfile(employee.id, profiles, monthEnd))
    .map((row) => `${row.firstName} ${row.lastName}`);
  if (names.length > 0) {
    throw new Error(
      `Payroll seed would fail for employees with no later profile: ${names.join(', ')}`,
    );
  }
  const covered = employees.filter((employee) =>
    profiles.some(
      (profile) =>
        profile.employeeId === employee.id &&
        approvedProfileCoversPayrollMonth(profile, BROWSER_BONUS_MONTH),
    ),
  );
  if (covered.length > 0) {
    throw new Error(`Another employee already covers ${BROWSER_BONUS_MONTH}`);
  }
}

function hasLaterProfile(
  employeeId: string,
  profiles: { employeeId: string; effectiveFrom: Date }[],
  monthEnd: Date,
): boolean {
  return profiles.some(
    (profile) => profile.employeeId === employeeId && profile.effectiveFrom > monthEnd,
  );
}

async function createBrowserBonusFixture(prisma: PrismaClient): Promise<DevPayrollIds> {
  const ids = emptyDevPayrollIds(randomUUID().replaceAll('-', '').slice(0, 12));
  const employeeId = await createPerson(prisma, ids);
  await seedCrmGraph(prisma, ids, employeeId);
  await retagCrmNotes(prisma, ids);
  await createClosedProfile(prisma, ids, employeeId);
  await createBonusPair(prisma, ids, employeeId);
  await createKpi(prisma, employeeId, ids.profileIds[0]);
  return ids;
}

async function createPerson(prisma: PrismaClient, ids: DevPayrollIds): Promise<string> {
  const role = await prisma.role.create({
    data: {
      name: `${BROWSER_BONUS_PREFIX} role ${ids.runToken}`,
      slug: `${BROWSER_BONUS_PREFIX}-role-${ids.runToken}`.toLowerCase(),
      level: 1,
      description: BROWSER_BONUS_MARKER,
    },
    select: { id: true },
  });
  ids.roleId = role.id;
  const employee = await prisma.employee.create({
    data: {
      firstName: 'Dev',
      lastName: 'Browserbonus',
      email: `${BROWSER_BONUS_PREFIX}-${ids.runToken}@nbos.invalid`.toLowerCase(),
      roleId: role.id,
      notes: BROWSER_BONUS_MARKER,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  ids.employeeIds.push(employee.id);
  return employee.id;
}

async function retagCrmNotes(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  const note = { notes: BROWSER_BONUS_MARKER };
  await prisma.contact.update({ where: { id: requireId(ids.contactId) }, data: note });
  await prisma.company.update({ where: { id: requireId(ids.companyId) }, data: note });
  await prisma.project.update({
    where: { id: requireId(ids.projectId) },
    data: { description: BROWSER_BONUS_MARKER },
  });
  await prisma.deal.update({ where: { id: requireId(ids.dealId) }, data: note });
  await prisma.order.update({ where: { id: requireId(ids.orderId) }, data: note });
}

async function createClosedProfile(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
): Promise<void> {
  const profile = await prisma.compensationProfile.create({
    data: {
      employeeId,
      baseSalary: new Decimal(SALARY_AMD),
      currency: 'AMD',
      effectiveFrom: startOfPayrollMonthUtc(BROWSER_BONUS_MONTH),
      effectiveTo: endOfPayrollMonthUtc(BROWSER_BONUS_MONTH),
      status: 'ACTIVE',
      notes: BROWSER_BONUS_MARKER,
    },
    select: { id: true },
  });
  ids.profileIds.push(profile.id);
}

async function createBonusPair(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  employeeId: string,
): Promise<void> {
  const parts = [
    { title: 'Dev browser part A', amount: BROWSER_BONUS_PART_A },
    { title: 'Dev browser part B', amount: BROWSER_BONUS_PART_B },
  ];
  for (const part of parts) {
    const entry = await prisma.bonusEntry.create({
      data: {
        employeeId,
        orderId: requireId(ids.orderId),
        projectId: requireId(ids.projectId),
        type: 'DELIVERY',
        amount: new Decimal(part.amount),
        originalAmount: new Decimal(part.amount),
        payableAmount: new Decimal(part.amount),
        percent: new Decimal(0),
        status: 'ACTIVE',
        earnedPeriod: BROWSER_BONUS_EARNED,
        title: part.title,
      },
      select: { id: true },
    });
    ids.entryIds.push(entry.id);
  }
}

async function createKpi(
  prisma: PrismaClient,
  employeeId: string,
  profileId: string | undefined,
): Promise<void> {
  await prisma.kpiResult.create({
    data: {
      employeeId,
      compensationProfileId: profileId,
      period: BROWSER_BONUS_EARNED,
      planAmount: new Decimal(BROWSER_BONUS_KPI_PLAN),
      actualAmount: new Decimal(BROWSER_BONUS_KPI_PLAN),
      attainmentPct: new Decimal(100),
      payoutFactor: new Decimal(1),
      source: 'MANUAL',
      notes: BROWSER_BONUS_MARKER,
    },
  });
}

async function reloadExisting(prisma: PrismaClient, employeeId: string): Promise<DevPayrollIds> {
  const ids = emptyDevPayrollIds('existing');
  ids.employeeIds.push(employeeId);
  const entries = await prisma.bonusEntry.findMany({
    where: { employeeId, title: { startsWith: 'Dev browser part' } },
    select: { id: true },
  });
  ids.entryIds.push(...entries.map((entry) => entry.id));
  return ids;
}

function requireId(id: string | undefined): string {
  if (!id) {
    throw new Error('Browser bonus fixture is missing a CRM id');
  }
  return id;
}
