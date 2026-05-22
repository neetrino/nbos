import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type CompensationProfileStatusEnum,
  type InputJsonValue,
} from '@nbos/database';
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

const PROFILE_STATUSES: CompensationProfileStatusEnum[] = ['DRAFT', 'REVIEW', 'ACTIVE', 'ARCHIVED'];
const include = compensationProfileInclude();

@Injectable()
export class CompensationProfilesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listForEmployee(employeeId: string) {
    await this.assertEmployeeExists(employeeId);
    const rows = await this.prisma.compensationProfile.findMany({
      where: { employeeId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      include,
    });
    return { items: rows.map(serializeCompensationProfile) };
  }

  async createDraft(employeeId: string, body: CreateCompensationProfileBody) {
    await this.assertEmployeeExists(employeeId);
    const effectiveFrom = parseDateOnly(body.effectiveFrom, 'effectiveFrom');
    if (!Number.isFinite(body.baseSalary) || body.baseSalary < 0) {
      throw new BadRequestException('baseSalary must be a non-negative number');
    }

    const kpiPolicyId = body.kpiPolicyId?.trim() || null;
    if (kpiPolicyId != null) {
      await this.assertActiveKpiPolicyExists(kpiPolicyId);
    }

    const row = await this.prisma.compensationProfile.create({
      data: {
        employeeId,
        baseSalary: body.baseSalary,
        currency: body.currency?.trim() || 'AMD',
        payoutSchedule: body.payoutSchedule,
        bonusPolicyId: body.bonusPolicyId?.trim() || null,
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

  async patchDraft(profileId: string, body: PatchCompensationProfileDraftBody) {
    const profile = await this.prisma.compensationProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    if (profile.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT compensation profiles can be edited');
    }

    let kpiPolicyId: string | null | undefined;
    if (body.kpiPolicyId !== undefined) {
      kpiPolicyId = body.kpiPolicyId?.trim() || null;
      if (kpiPolicyId != null) {
        await this.assertActiveKpiPolicyExists(kpiPolicyId);
      }
    }

    if (body.baseSalary != null && (!Number.isFinite(body.baseSalary) || body.baseSalary < 0)) {
      throw new BadRequestException('baseSalary must be a non-negative number');
    }

    const row = await this.prisma.compensationProfile.update({
      where: { id: profileId },
      data: {
        baseSalary: body.baseSalary,
        currency: body.currency?.trim(),
        bonusPolicyId:
          body.bonusPolicyId === undefined ? undefined : body.bonusPolicyId?.trim() || null,
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

  async activate(profileId: string, meta: ActivateCompensationProfileMeta) {
    const profile = await this.prisma.compensationProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    if (profile.status === 'ARCHIVED') {
      throw new BadRequestException('Archived compensation profiles cannot be activated');
    }
    if (profile.status === 'ACTIVE') {
      return this.findById(profileId);
    }
    if (!PROFILE_STATUSES.includes(profile.status)) {
      throw new BadRequestException(`Unsupported profile status: ${profile.status}`);
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const priorActive = await tx.compensationProfile.findMany({
        where: { employeeId: profile.employeeId, status: 'ACTIVE', id: { not: profileId } },
      });
      for (const prior of priorActive) {
        await tx.compensationProfile.update({
          where: { id: prior.id },
          data: {
            status: 'ARCHIVED',
            effectiveTo: profile.effectiveFrom,
          },
        });
      }

      return tx.compensationProfile.update({
        where: { id: profileId },
        data: {
          status: 'ACTIVE',
          approvedById: meta.approvedById ?? undefined,
          approvedAt: now,
        },
        include,
      });
    });

    return serializeCompensationProfile(updated);
  }

  async findById(profileId: string) {
    const row = await this.prisma.compensationProfile.findUnique({
      where: { id: profileId },
      include,
    });
    if (!row) {
      throw new NotFoundException(`Compensation profile ${profileId} not found`);
    }
    return serializeCompensationProfile(row);
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
