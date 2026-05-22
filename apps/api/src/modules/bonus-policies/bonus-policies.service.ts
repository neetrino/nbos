import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type BonusPolicyStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { parseBonusPolicyTemplateCode } from './parse-bonus-policy-template';
import type {
  BonusPolicyDto,
  CreateBonusPolicyBody,
  UpdateBonusPolicyBody,
} from './bonus-policies.types';

const STATUSES: BonusPolicyStatusEnum[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

function assertPolicyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 120) {
    throw new BadRequestException('name must be between 2 and 120 characters');
  }
  return trimmed;
}

function serializeBonusPolicy(
  row: {
    id: string;
    name: string;
    templateCode: string;
    status: BonusPolicyStatusEnum;
    scope: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  linkedProfileCount: number,
): BonusPolicyDto {
  return {
    id: row.id,
    name: row.name,
    templateCode: row.templateCode,
    status: row.status,
    scope: row.scope,
    notes: row.notes,
    linkedProfileCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class BonusPoliciesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(): Promise<{ items: BonusPolicyDto[] }> {
    const rows = await this.prisma.bonusPolicy.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    const counts = await this.profileCountsByPolicyId(rows.map((r) => r.id));
    return {
      items: rows.map((row) => serializeBonusPolicy(row, counts.get(row.id) ?? 0)),
    };
  }

  async findById(id: string): Promise<BonusPolicyDto> {
    const row = await this.prisma.bonusPolicy.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Bonus policy ${id} not found`);
    }
    const count = await this.prisma.compensationProfile.count({
      where: { bonusPolicyId: id },
    });
    return serializeBonusPolicy(row, count);
  }

  async create(body: CreateBonusPolicyBody): Promise<BonusPolicyDto> {
    const name = assertPolicyName(body.name);
    const templateCode = parseBonusPolicyTemplateCode(body.templateCode);
    const row = await this.prisma.bonusPolicy.create({
      data: {
        name,
        templateCode,
        status: 'ACTIVE',
        scope: body.scope?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });
    return serializeBonusPolicy(row, 0);
  }

  async update(id: string, body: UpdateBonusPolicyBody): Promise<BonusPolicyDto> {
    const existing = await this.prisma.bonusPolicy.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bonus policy ${id} not found`);
    }
    if (body.status != null && !STATUSES.includes(body.status)) {
      throw new BadRequestException(`Invalid status: ${body.status}`);
    }

    const row = await this.prisma.bonusPolicy.update({
      where: { id },
      data: {
        name: body.name != null ? assertPolicyName(body.name) : undefined,
        status: body.status,
        scope: body.scope === undefined ? undefined : body.scope?.trim() || null,
        notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
      },
    });
    const count = await this.prisma.compensationProfile.count({
      where: { bonusPolicyId: id },
    });
    return serializeBonusPolicy(row, count);
  }

  private async profileCountsByPolicyId(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const groups = await this.prisma.compensationProfile.groupBy({
      by: ['bonusPolicyId'],
      where: { bonusPolicyId: { in: ids } },
      _count: { _all: true },
    });
    return new Map(
      groups
        .filter((g) => g.bonusPolicyId != null)
        .map((g) => [g.bonusPolicyId as string, g._count._all] as const),
    );
  }
}
