import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type CompensationProfileStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  compensationProfileInclude,
  serializeCompensationProfile,
} from './compensation-profile-serialize';
import type {
  ActivateCompensationProfileMeta,
  CreateCompensationProfileBody,
  PatchCompensationProfileDraftBody,
} from './compensation-profiles.types';
import { activateCompensationProfileInTransaction } from './activate-compensation-profile';
import {
  FINANCE_SALARY_MODULE,
  assertEmployeeAccessible,
  assertFinancePayScope,
  bindAuthenticatedApprover,
  resolveAccessibleEmployeeIds,
  type FinancePayActor,
} from './finance-pay-access';
import {
  approvedProfileCoversPayrollMonth,
  endOfPayrollMonthUtc,
  payrollMonthForInstant,
  startOfPayrollMonthUtc,
} from './compensation-profile-payroll-month';
import {
  APPROVED_COMPENSATION_PROFILE_STATUS,
  uniqueCoveringProfilePerEmployee,
} from './resolve-active-compensation-profile';
import {
  assertEmployeeTakeHomeCurrency,
  resolveCreateCompensationProfileCurrency,
  resolvePatchCompensationProfileCurrency,
} from './compensation-profile-currency';

const PROFILE_STATUSES: CompensationProfileStatusEnum[] = ['DRAFT', 'REVIEW', 'ACTIVE', 'ARCHIVED'];
const include = compensationProfileInclude();

@Injectable()
export class CompensationProfilesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listForEmployee(actor: FinancePayActor, employeeId: string) {
    await this.assertProfileAccess(actor, 'VIEW', employeeId);
    await this.assertEmployeeExists(employeeId);
    const rows = await this.prisma.compensationProfile.findMany({
      where: { employeeId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      include,
    });
    return { items: rows.map(serializeCompensationProfile) };
  }

  async createDraft(
    actor: FinancePayActor,
    employeeId: string,
    body: CreateCompensationProfileBody,
  ) {
    await this.assertProfileAccess(actor, 'EDIT', employeeId);
    await this.assertEmployeeExists(employeeId);
    const effectiveFrom = parseDateOnly(body.effectiveFrom, 'effectiveFrom');
    if (!Number.isFinite(body.baseSalary) || body.baseSalary < 0) {
      throw new BadRequestException('baseSalary must be a non-negative number');
    }
    const currency = resolveCreateCompensationProfileCurrency(body.currency);

    const bonusPolicyId = body.bonusPolicyId?.trim() || null;
    if (bonusPolicyId != null) {
      await this.assertActiveBonusPolicyExists(bonusPolicyId);
    }

    const kpiPolicyId = body.kpiPolicyId?.trim() || null;
    if (kpiPolicyId != null) {
      await this.assertActiveKpiPolicyExists(kpiPolicyId);
    }

    const row = await this.prisma.compensationProfile.create({
      data: {
        employeeId,
        baseSalary: body.baseSalary,
        currency,
        payoutSchedule: body.payoutSchedule,
        bonusPolicyId,
        kpiPolicyId,
        effectiveFrom,
        status: 'DRAFT',
        notes: body.notes?.trim() || null,
        source: body.source?.trim() || 'MANUAL',
      },
      include,
    });
    return serializeCompensationProfile(row);
  }

  async patchDraft(
    actor: FinancePayActor,
    profileId: string,
    body: PatchCompensationProfileDraftBody,
  ) {
    const profile = await this.prisma.compensationProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    await this.assertProfileAccess(actor, 'EDIT', profile.employeeId);
    if (profile.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT compensation profiles can be edited');
    }
    const currency = resolvePatchCompensationProfileCurrency(body.currency);
    const bonusPolicyId = await resolveOptionalPolicyId(body.bonusPolicyId, (id) =>
      this.assertActiveBonusPolicyExists(id),
    );
    const kpiPolicyId = await resolveOptionalPolicyId(body.kpiPolicyId, (id) =>
      this.assertActiveKpiPolicyExists(id),
    );

    if (body.baseSalary != null && (!Number.isFinite(body.baseSalary) || body.baseSalary < 0)) {
      throw new BadRequestException('baseSalary must be a non-negative number');
    }

    const row = await this.prisma.compensationProfile.update({
      where: { id: profileId },
      data: {
        baseSalary: body.baseSalary,
        currency,
        bonusPolicyId,
        kpiPolicyId,
        effectiveFrom:
          body.effectiveFrom != null
            ? parseDateOnly(body.effectiveFrom, 'effectiveFrom')
            : undefined,
        notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
      },
      include,
    });
    return serializeCompensationProfile(row);
  }

  async activate(actor: FinancePayActor, profileId: string, meta: ActivateCompensationProfileMeta) {
    const profile = await this.prisma.compensationProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    await this.assertProfileAccess(actor, 'EDIT', profile.employeeId);
    const approvedById = bindAuthenticatedApprover(actor.id, meta.approvedById);
    if (profile.status === 'ARCHIVED') {
      throw new BadRequestException('Archived compensation profiles cannot be activated');
    }
    assertEmployeeTakeHomeCurrency(profile.currency, `Compensation profile ${profile.id}`);
    if (profile.status === 'ACTIVE') {
      if (approvedProfileCoversPayrollMonth(profile, payrollMonthForInstant(new Date()))) {
        await this.copyBaseSalaryToEmployee(profile.employeeId, profile.baseSalary);
      }
      return this.findById(actor, profileId);
    }
    if (!PROFILE_STATUSES.includes(profile.status)) {
      throw new BadRequestException(`Unsupported profile status: ${profile.status}`);
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) =>
      activateCompensationProfileInTransaction(tx, profile, approvedById, now),
    );

    return serializeCompensationProfile(updated);
  }

  async listActiveSummaries(actor: FinancePayActor) {
    const accessible = await this.resolveCompensationAccess(actor, 'VIEW');
    const payrollMonth = payrollMonthForInstant(new Date());
    const monthStart = startOfPayrollMonthUtc(payrollMonth);
    const monthEnd = endOfPayrollMonthUtc(payrollMonth);
    const rows = await this.prisma.compensationProfile.findMany({
      where: {
        status: APPROVED_COMPENSATION_PROFILE_STATUS,
        effectiveFrom: { lte: monthEnd },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
        ...(accessible === 'ALL' ? {} : { employeeId: { in: accessible } }),
      },
      select: {
        employeeId: true,
        baseSalary: true,
        currency: true,
        bonusPolicy: { select: { name: true, templateCode: true } },
        kpiPolicy: { select: { name: true } },
      },
    });
    const unique = uniqueCoveringProfilePerEmployee(rows, payrollMonth);
    return {
      items: unique.map((row) => ({
        employeeId: row.employeeId,
        baseSalary: row.baseSalary.toString(),
        currency: row.currency,
        bonusPolicyName: row.bonusPolicy?.name ?? null,
        bonusTemplateCode: row.bonusPolicy?.templateCode ?? null,
        kpiPolicyName: row.kpiPolicy?.name ?? null,
      })),
    };
  }

  async findById(actor: FinancePayActor, profileId: string) {
    const row = await this.prisma.compensationProfile.findUnique({
      where: { id: profileId },
      include,
    });
    if (!row) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    await this.assertProfileAccess(actor, 'VIEW', row.employeeId);
    return serializeCompensationProfile(row);
  }

  private async resolveCompensationAccess(actor: FinancePayActor, action: 'VIEW' | 'EDIT') {
    const scope = assertFinancePayScope(actor, FINANCE_SALARY_MODULE, action, [
      'ALL',
      'DEPARTMENT',
      'OWN',
    ]);
    return resolveAccessibleEmployeeIds(this.prisma, actor, scope);
  }

  private async assertProfileAccess(
    actor: FinancePayActor,
    action: 'VIEW' | 'EDIT',
    employeeId: string,
  ) {
    const accessible = await this.resolveCompensationAccess(actor, action);
    assertEmployeeAccessible(employeeId, accessible);
  }

  private async copyBaseSalaryToEmployee(employeeId: string, baseSalary: { toString(): string }) {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { baseSalary: baseSalary.toString() },
    });
  }

  private async assertEmployeeExists(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!emp) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
  }

  private async assertActiveBonusPolicyExists(bonusPolicyId: string) {
    const policy = await this.prisma.bonusPolicy.findFirst({
      where: { id: bonusPolicyId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!policy) {
      throw new BadRequestException(`Active bonus policy ${bonusPolicyId} not found`);
    }
  }

  private async assertActiveKpiPolicyExists(kpiPolicyId: string) {
    const policy = await this.prisma.kpiPolicy.findFirst({
      where: { id: kpiPolicyId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!policy) {
      throw new BadRequestException(`Active KPI policy ${kpiPolicyId} not found`);
    }
  }
}

function parseDateOnly(value: string, field: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO date`);
  }
  return d;
}

async function resolveOptionalPolicyId(
  raw: string | null | undefined,
  assertActiveExists: (id: string) => Promise<void>,
): Promise<string | null | undefined> {
  if (raw === undefined) {
    return undefined;
  }
  const policyId = raw?.trim() || null;
  if (policyId != null) {
    await assertActiveExists(policyId);
  }
  return policyId;
}
