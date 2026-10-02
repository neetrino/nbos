import { randomUUID } from 'node:crypto';

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { afterAll, describe, expect, it } from 'vitest';

import { createPrismaClient, Decimal, type PrismaClient } from '@nbos/database';

import { guardedNamelessTermDatabaseUrl } from '../bonus/sales-bonus-order-accrual.race-env';
import { CompensationProfilesService } from '../compensation-profiles/compensation-profiles.service';
import { payrollMonthForInstant } from '../compensation-profiles/compensation-profile-payroll-month';
import type { FinancePayActor } from '../compensation-profiles/finance-pay-access';
import { planPayrollSalaryLines } from './seed-payroll-run-salary-lines';
import { PayrollRunsService } from './payroll-runs.service';
import {
  deleteHireGraph,
  FULL_SALARY,
  HIRE_DAY,
  HIRE_MONTH,
  MONTH_BEFORE_HIRE,
  payActor,
  salaryDraftBody,
  seedHireGraph,
  seedScopedRun,
  silentNotifications,
  type HireGraph,
} from './payroll-dev-postgres.hire-access.fixture';

const DATABASE_URL = guardedNamelessTermDatabaseUrl();
const CASE_TIMEOUT_MS = 90_000;

describe.skipIf(!DATABASE_URL)('payroll hire month and pay scope on dev PostgreSQL', () => {
  const clients: PrismaClient[] = [];

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  it(
    'activates a mid-month hire for the full start month and ignores a foreign approver',
    async () => {
      const prisma = openClient();
      const graph = await seedHireGraph(prisma);
      try {
        const hired = await hireThroughSalaryProfile(prisma, graph);
        expect(hired.hireMonth).toBe(HIRE_MONTH);
        expect(hired.marchSalary).toBe(`${FULL_SALARY}.00`);
        expect(hired.februarySalary).toBeNull();
        expect(hired.currentBaseSalary).toBeNull();
        expect(hired.approvedById).toBe(graph.actorId);
      } finally {
        await deleteHireGraph(prisma, graph);
      }
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'scopes own, department, and all, and hides another employee and a guessed line',
    async () => {
      const prisma = openClient();
      const graph = await seedHireGraph(prisma);
      try {
        const runId = await seedScopedRun(prisma, graph);
        await seedScopeProfiles(prisma, graph);
        await expectScopeReads(prisma, graph, runId);
      } finally {
        await deleteHireGraph(prisma, graph);
      }
    },
    CASE_TIMEOUT_MS,
  );

  function openClient(): PrismaClient {
    const client = createPrismaClient({
      databaseUrl: DATABASE_URL,
      skipBudgetAssert: true,
      skipUrlRewrite: true,
    });
    clients.push(client);
    return client;
  }
});

async function hireThroughSalaryProfile(prisma: PrismaClient, graph: HireGraph) {
  const sheetIso = new Date(HIRE_DAY).toISOString();
  await prisma.employee.update({
    where: { id: graph.actorId },
    data: { hireDate: new Date(sheetIso) },
  });
  await assignInitialRole(prisma, graph);
  const profiles = new CompensationProfilesService(prisma);
  const editor = payActor(graph.actorId, 'ALL', []);
  const draft = await profiles.createDraft(editor, graph.actorId, salaryDraftBody());
  graph.profileIds.push(draft.id);
  await expectForeignApproverRejected(prisma, profiles, editor, graph, draft.id);
  await profiles.activate(editor, draft.id, { approvedById: graph.actorId });
  return readHireOutcome(prisma, graph);
}

async function assignInitialRole(prisma: PrismaClient, graph: HireGraph): Promise<void> {
  await prisma.permissionRoleAssignment.create({
    data: {
      employeeId: graph.actorId,
      roleId: graph.roleId,
      source: 'LEGACY',
      isPrimary: true,
      assignedById: graph.actorId,
      reason: 'Initial employee permission role',
    },
  });
}

async function expectForeignApproverRejected(
  prisma: PrismaClient,
  profiles: CompensationProfilesService,
  editor: FinancePayActor,
  graph: HireGraph,
  profileId: string,
): Promise<void> {
  await expect(
    profiles.activate(editor, profileId, { approvedById: graph.outsiderId }),
  ).rejects.toBeInstanceOf(BadRequestException);
  const rejected = await prisma.compensationProfile.findUnique({
    where: { id: profileId },
    select: { status: true, approvedById: true },
  });
  expect(rejected).toEqual({ status: 'DRAFT', approvedById: null });
}

async function readHireOutcome(prisma: PrismaClient, graph: HireGraph) {
  const employee = await prisma.employee.findUnique({
    where: { id: graph.actorId },
    select: {
      id: true,
      status: true,
      firstName: true,
      lastName: true,
      fireDate: true,
      hireDate: true,
      baseSalary: true,
    },
  });
  const profile = await prisma.compensationProfile.findUnique({
    where: { id: requireProfileId(graph) },
    select: {
      id: true,
      employeeId: true,
      baseSalary: true,
      currency: true,
      kpiPolicyId: true,
      effectiveFrom: true,
      effectiveTo: true,
      status: true,
      approvedById: true,
    },
  });
  if (!employee?.hireDate || !profile) throw new Error('hire graph is incomplete');
  if (profile.status !== 'ACTIVE') throw new Error('hire profile did not activate');
  const planned = (month: string) =>
    planPayrollSalaryLines([employee], [profile], month)[0]?.baseSalary.toFixed(2) ?? null;
  return {
    hireMonth: payrollMonthForInstant(employee.hireDate),
    marchSalary: planned(HIRE_MONTH),
    februarySalary: planned(MONTH_BEFORE_HIRE),
    currentBaseSalary: employee.baseSalary?.toFixed(2) ?? null,
    approvedById: profile.approvedById,
  };
}

async function seedScopeProfiles(prisma: PrismaClient, graph: HireGraph): Promise<void> {
  const profiles = new CompensationProfilesService(prisma);
  const editor = payActor(graph.actorId, 'ALL', []);
  const actorDraft = await profiles.createDraft(editor, graph.actorId, salaryDraftBody());
  const colleagueDraft = await profiles.createDraft(editor, graph.colleagueId, salaryDraftBody());
  graph.profileIds.push(actorDraft.id, colleagueDraft.id);
}

async function expectScopeReads(prisma: PrismaClient, graph: HireGraph, runId: string) {
  const payroll = new PayrollRunsService(prisma, silentNotifications());
  const profiles = new CompensationProfilesService(prisma);
  const homeDepartment = graph.departmentIds[0] ?? '';
  await expectOwnScope(
    payroll,
    profiles,
    payActor(graph.actorId, 'OWN', [homeDepartment]),
    graph,
    runId,
  );
  await expectDepartmentScope(
    prisma,
    payroll,
    profiles,
    payActor(graph.actorId, 'DEPARTMENT', [homeDepartment]),
    graph,
    runId,
  );
  await expectAllScope(payroll, payActor(graph.actorId, 'ALL', []), runId);
}

async function expectOwnScope(
  payroll: PayrollRunsService,
  profiles: CompensationProfilesService,
  own: FinancePayActor,
  graph: HireGraph,
  runId: string,
) {
  await expect(payroll.findById(own, runId)).rejects.toBeInstanceOf(ForbiddenException);
  await expect(profiles.listForEmployee(own, graph.outsiderId)).rejects.toBeInstanceOf(
    ForbiddenException,
  );
  const ownList = await profiles.listForEmployee(own, graph.actorId);
  expect(ownList.items.map((item) => item.employeeId)).toEqual([graph.actorId]);
}

async function expectDepartmentScope(
  prisma: PrismaClient,
  payroll: PayrollRunsService,
  profiles: CompensationProfilesService,
  department: FinancePayActor,
  graph: HireGraph,
  runId: string,
) {
  const departmentRun = await payroll.findById(department, runId);
  expect(lineEmployeeIds(departmentRun)).toEqual([graph.actorId, graph.colleagueId].sort());
  expect(new Decimal(departmentRun.totalBaseSalary).toFixed(2)).toBe('120000.00');
  await expect(profiles.listForEmployee(department, graph.outsiderId)).rejects.toBeInstanceOf(
    ForbiddenException,
  );
  const colleagueList = await profiles.listForEmployee(department, graph.colleagueId);
  expect(colleagueList.items.map((item) => item.employeeId)).toEqual([graph.colleagueId]);
  const outsiderLine = await outsiderSalaryLineId(prisma, runId, graph.outsiderId);
  await expect(payroll.getSalaryLineMonthDetail(department, outsiderLine)).rejects.toBeInstanceOf(
    ForbiddenException,
  );
}

async function expectAllScope(payroll: PayrollRunsService, all: FinancePayActor, runId: string) {
  const allRun = await payroll.findById(all, runId);
  expect(lineEmployeeIds(allRun)).toHaveLength(3);
  expect(new Decimal(allRun.totalBaseSalary).toFixed(2)).toBe('200000.00');
  await expect(payroll.getSalaryLineMonthDetail(all, randomUUID())).rejects.toBeInstanceOf(
    NotFoundException,
  );
}

function lineEmployeeIds(run: { salaryLines: Array<{ employeeId: string }> }): string[] {
  return run.salaryLines.map((line) => line.employeeId).sort();
}

function requireProfileId(graph: HireGraph): string {
  const id = graph.profileIds[0];
  if (!id) throw new Error('missing compensation profile');
  return id;
}

async function outsiderSalaryLineId(
  prisma: PrismaClient,
  runId: string,
  outsiderId: string,
): Promise<string> {
  const line = await prisma.salaryLine.findFirst({
    where: { payrollRunId: runId, employeeId: outsiderId },
    select: { id: true },
  });
  if (!line) throw new Error('missing outsider salary line');
  return line.id;
}
