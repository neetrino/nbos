import { randomUUID } from 'node:crypto';

import { Decimal, type PrismaClient } from '@nbos/database';

import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';
import type { NotificationService } from '../notifications/notification.service';
import { PAYROLL_DEV_MARKER, PAYROLL_DEV_PREFIX } from './payroll-dev-postgres.ids';
import { claimPayrollMonths } from './payroll-dev-postgres.seed';

export const HIRE_DAY = '2094-03-16';
export const HIRE_MONTH = '2094-03';
export const MONTH_BEFORE_HIRE = '2094-02';
export const FULL_SALARY = 180_000;
const ACTOR_LINE = '100000.00';
const COLLEAGUE_LINE = '20000.00';
const OUTSIDER_LINE = '80000.00';

export interface HireGraph {
  token: string;
  roleId: string;
  actorId: string;
  colleagueId: string;
  outsiderId: string;
  departmentIds: string[];
  profileIds: string[];
  payrollRunIds: string[];
}

export async function seedHireGraph(prisma: PrismaClient): Promise<HireGraph> {
  const token = randomUUID().replaceAll('-', '').slice(0, 12);
  const role = await prisma.role.create({ data: roleData(token), select: { id: true } });
  const actor = await createMarkedEmployee(prisma, role.id, token, 'Actor');
  const colleague = await createMarkedEmployee(prisma, role.id, token, 'Colleague');
  const outsider = await createMarkedEmployee(prisma, role.id, token, 'Outsider');
  const home = await createMarkedDepartment(prisma, token, 'home');
  const away = await createMarkedDepartment(prisma, token, 'away');
  await prisma.employeeDepartment.createMany({
    data: [
      { employeeId: actor.id, departmentId: home.id, isPrimary: true },
      { employeeId: colleague.id, departmentId: home.id, isPrimary: true },
      { employeeId: outsider.id, departmentId: away.id, isPrimary: true },
    ],
  });
  return emptyGraph(token, role.id, actor.id, colleague.id, outsider.id, home.id, away.id);
}

export async function seedScopedRun(prisma: PrismaClient, graph: HireGraph): Promise<string> {
  const [month] = await claimPayrollMonths(prisma, 1);
  if (!month) throw new Error('no free payroll month');
  const companyTotal = new Decimal(ACTOR_LINE).plus(COLLEAGUE_LINE).plus(OUTSIDER_LINE);
  const run = await prisma.payrollRun.create({
    data: {
      payrollMonth: month,
      status: 'REVIEW',
      totalBaseSalary: companyTotal,
      totalBonuses: new Decimal(0),
      totalPayable: companyTotal,
      totalPaid: new Decimal(0),
      createdById: graph.actorId,
    },
    select: { id: true },
  });
  graph.payrollRunIds.push(run.id);
  await prisma.salaryLine.createMany({
    data: [
      lineData(run.id, graph.actorId, ACTOR_LINE),
      lineData(run.id, graph.colleagueId, COLLEAGUE_LINE),
      lineData(run.id, graph.outsiderId, OUTSIDER_LINE),
    ],
  });
  return run.id;
}

export async function deleteHireGraph(prisma: PrismaClient, graph: HireGraph): Promise<void> {
  const people = [graph.actorId, graph.colleagueId, graph.outsiderId];
  if (graph.payrollRunIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: graph.payrollRunIds } } });
    await prisma.payrollRun.deleteMany({ where: { id: { in: graph.payrollRunIds } } });
  }
  if (graph.profileIds.length > 0) {
    await prisma.compensationProfile.deleteMany({ where: { id: { in: graph.profileIds } } });
  }
  await prisma.employee.deleteMany({ where: { id: { in: people }, notes: PAYROLL_DEV_MARKER } });
  await prisma.department.deleteMany({ where: { id: { in: graph.departmentIds } } });
  await prisma.role.deleteMany({ where: { id: graph.roleId } });
}

export function payActor(
  id: string,
  scope: 'OWN' | 'DEPARTMENT' | 'ALL',
  departmentIds: string[],
): FinancePayActor {
  return {
    id,
    permissions: { FINANCE_SALARY_VIEW: scope, FINANCE_SALARY_EDIT: scope },
    departmentIds,
  };
}

export function silentNotifications(): NotificationService {
  return new Proxy({}, { get: () => () => Promise.resolve(undefined) }) as NotificationService;
}

export function salaryDraftBody() {
  return {
    baseSalary: FULL_SALARY,
    currency: 'AMD',
    effectiveFrom: HIRE_DAY,
    notes: PAYROLL_DEV_MARKER,
  };
}

function emptyGraph(
  token: string,
  roleId: string,
  actorId: string,
  colleagueId: string,
  outsiderId: string,
  homeId: string,
  awayId: string,
): HireGraph {
  return {
    token,
    roleId,
    actorId,
    colleagueId,
    outsiderId,
    departmentIds: [homeId, awayId],
    profileIds: [],
    payrollRunIds: [],
  };
}

function lineData(payrollRunId: string, employeeId: string, amount: string) {
  const money = new Decimal(amount);
  return {
    payrollRunId,
    employeeId,
    baseSalary: money,
    bonusesTotal: new Decimal(0),
    totalPayable: money,
    paidAmount: new Decimal(0),
    remainingAmount: money,
  };
}

function roleData(token: string) {
  return {
    name: `${PAYROLL_DEV_PREFIX} hire ${token}`,
    slug: `${PAYROLL_DEV_PREFIX}-hire-${token}`.toLowerCase(),
    level: 1,
    description: PAYROLL_DEV_MARKER,
  };
}

function createMarkedEmployee(prisma: PrismaClient, roleId: string, token: string, label: string) {
  return prisma.employee.create({
    data: {
      firstName: 'Dev',
      lastName: `${label} ${token}`,
      email: `${PAYROLL_DEV_PREFIX}-hire-${label}-${token}@nbos.invalid`.toLowerCase(),
      roleId,
      notes: PAYROLL_DEV_MARKER,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
}

function createMarkedDepartment(prisma: PrismaClient, token: string, label: string) {
  return prisma.department.create({
    data: {
      name: `${PAYROLL_DEV_PREFIX} ${label} ${token}`,
      slug: `${PAYROLL_DEV_PREFIX}-hire-${label}-${token}`.toLowerCase(),
      description: PAYROLL_DEV_MARKER,
    },
    select: { id: true },
  });
}
