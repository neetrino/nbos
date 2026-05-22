import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type BonusPolicyStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { BonusPolicyDto } from './bonus-policies.types';

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
