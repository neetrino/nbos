import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type KpiPolicyStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { KPI_POLICY_TEMPLATE_GATE_PAYOUT } from '../payroll-runs/kpi-gate-rules.types';
import { parseKpiGateRules } from '../payroll-runs/parse-kpi-gate-rules';
import type { CreateKpiPolicyBody, KpiPolicyDto, UpdateKpiPolicyBody } from './kpi-policies.types';

const STATUSES: KpiPolicyStatusEnum[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

function serializeKpiPolicy(
  row: {
    id: string;
    name: string;
    templateCode: string;
    gateRules: unknown;
    status: KpiPolicyStatusEnum;
    scope: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  linkedProfileCount: number,
): KpiPolicyDto {
  return {
    id: row.id,
    name: row.name,
    templateCode: row.templateCode,
    gateRules: parseKpiGateRules(row.gateRules),
    status: row.status,
    scope: row.scope,
    notes: row.notes,
    linkedProfileCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertPolicyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 120) {
    throw new BadRequestException('name must be between 2 and 120 characters');
  }
  return trimmed;
}

@Injectable()
export class KpiPoliciesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(): Promise<{ items: KpiPolicyDto[] }> {
    const rows = await this.prisma.kpiPolicy.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    const counts = await this.profileCountsByPolicyId(rows.map((r) => r.id));
    return {
      items: rows.map((r) => serializeKpiPolicy(r, counts.get(r.id) ?? 0)),
    };
  }

  async findById(id: string): Promise<KpiPolicyDto> {
    const row = await this.prisma.kpiPolicy.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`KPI policy ${id} not found`);
    }
    const count = await this.prisma.compensationProfile.count({
      where: { kpiPolicyId: id },
    });
    return serializeKpiPolicy(row, count);
  }

  async create(body: CreateKpiPolicyBody): Promise<KpiPolicyDto> {
    const name = assertPolicyName(body.name);
    const gateRules = parseKpiGateRules(body.gateRules);
    const row = await this.prisma.kpiPolicy.create({
      data: {
        name,
        templateCode: KPI_POLICY_TEMPLATE_GATE_PAYOUT,
        gateRules,
        status: 'ACTIVE',
        scope: body.scope?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });
    return serializeKpiPolicy(row, 0);
  }

  async update(id: string, body: UpdateKpiPolicyBody): Promise<KpiPolicyDto> {
    const existing = await this.prisma.kpiPolicy.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`KPI policy ${id} not found`);
    }
    if (body.status != null && !STATUSES.includes(body.status)) {
      throw new BadRequestException(`Invalid status: ${body.status}`);
    }

    const row = await this.prisma.kpiPolicy.update({
      where: { id },
      data: {
        name: body.name != null ? assertPolicyName(body.name) : undefined,
        gateRules: body.gateRules != null ? parseKpiGateRules(body.gateRules) : undefined,
        status: body.status,
        scope: body.scope === undefined ? undefined : body.scope?.trim() || null,
        notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
      },
    });
    const count = await this.prisma.compensationProfile.count({
      where: { kpiPolicyId: id },
    });
    return serializeKpiPolicy(row, count);
  }

  private async profileCountsByPolicyId(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const groups = await this.prisma.compensationProfile.groupBy({
      by: ['kpiPolicyId'],
      where: { kpiPolicyId: { in: ids } },
      _count: { _all: true },
    });
    return new Map(
      groups
        .filter((g) => g.kpiPolicyId != null)
        .map((g) => [g.kpiPolicyId as string, g._count._all] as const),
    );
  }
}
