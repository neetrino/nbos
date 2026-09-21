import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  parseSalePriceBody,
  resolveSalePrice,
  salePriceTargetKey,
  type SalePriceTarget,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { loadUnitsBySaleTarget } from './sale-price-target-units';

export type SalePriceVersionDto = {
  id: string;
  targetKey: string;
  version: number;
  status: string;
  effectiveFrom: string;
  amountPerUnit: string | null;
  resolvedAmount: string | null;
  currency: string;
};

const FIRST_VERSION = 1;

/**
 * Sale rates of catalog items. This is what a client pays per unit, not what a team is paid:
 * publishing a sale rate cannot change anybody's bonus. Versioned all the same, so a later edit
 * never re-prices a deal that was already assembled.
 */
@Injectable()
export class SalePricesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(targetKey?: string, includeRate = false): Promise<SalePriceVersionDto[]> {
    const rows = await this.prisma.deliverySalePriceVersion.findMany({
      where: {
        ...(targetKey ? { targetKey } : {}),
        ...(includeRate ? {} : { status: 'PUBLISHED' }),
      },
      orderBy: [{ targetKey: 'asc' }, { version: 'desc' }],
    });
    return this.serializeMany(rows, includeRate);
  }

  async createDraft(target: SalePriceTarget, body: unknown): Promise<SalePriceVersionDto> {
    const input = parseSalePriceBody(body, target);
    await this.assertTargetExists(target);
    const targetKey = salePriceTargetKey(target);
    const last = await this.prisma.deliverySalePriceVersion.findFirst({
      where: { targetKey },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const created = await this.prisma.deliverySalePriceVersion.create({
      data: {
        targetKey,
        functionId: target.kind === 'FUNCTION' ? target.functionId : null,
        tierId: target.kind === 'TIER' ? target.tierId : null,
        baseProfileVersionId: target.kind === 'CORE' ? target.baseProfileVersionId : null,
        version: (last?.version ?? 0) + FIRST_VERSION,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
        amountPerUnit: input.amountPerUnit,
      },
    });
    return requiredSerialized(await this.serializeMany([created], true));
  }

  /** Publishing supersedes the previously published price of the same item. */
  async publish(id: string, publishedById: string): Promise<SalePriceVersionDto> {
    const version = await this.prisma.deliverySalePriceVersion.findUnique({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Sale price version ${id} not found`);
    }
    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft sale price can be published.');
    }
    const published = await this.prisma.$transaction(async (tx) => {
      await tx.deliverySalePriceVersion.updateMany({
        where: { targetKey: version.targetKey, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });
      return tx.deliverySalePriceVersion.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedById, publishedAt: new Date() },
      });
    });
    return requiredSerialized(await this.serializeMany([published], true));
  }

  private async serializeMany(
    rows: readonly SalePriceRecord[],
    includeRate: boolean,
  ): Promise<SalePriceVersionDto[]> {
    if (rows.length === 0) return [];
    const unitsByTarget = await loadUnitsBySaleTarget(this.prisma, rows);
    return rows.map((row) =>
      serializeWithoutUnits(row, unitsByTarget.get(row.targetKey) ?? null, includeRate),
    );
  }

  private async assertTargetExists(target: SalePriceTarget): Promise<void> {
    const exists = await this.countTarget(target);
    if (exists === 0) {
      throw new NotFoundException('The item this price belongs to does not exist.');
    }
  }

  private countTarget(target: SalePriceTarget): Promise<number> {
    if (target.kind === 'FUNCTION') {
      return this.prisma.deliveryFunction.count({ where: { id: target.functionId } });
    }
    if (target.kind === 'TIER') {
      return this.prisma.deliveryFunctionTier.count({ where: { id: target.tierId } });
    }
    return this.prisma.deliveryBaseProfileVersion.count({
      where: { id: target.baseProfileVersionId },
    });
  }
}

type SalePriceRecord = {
  id: string;
  targetKey: string;
  functionId: string | null;
  tierId: string | null;
  baseProfileVersionId: string | null;
  version: number;
  status: string;
  effectiveFrom: Date;
  amountPerUnit: { toString(): string };
  currency: string;
};

function serializeWithoutUnits(
  row: SalePriceRecord,
  units: string | null,
  includeRate: boolean,
): SalePriceVersionDto {
  const amountPerUnit = row.amountPerUnit.toString();
  return {
    id: row.id,
    targetKey: row.targetKey,
    version: row.version,
    status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString(),
    amountPerUnit: includeRate ? amountPerUnit : null,
    resolvedAmount: resolveSalePrice({ units, amountPerUnit }).amount,
    currency: row.currency,
  };
}

function requiredSerialized(rows: SalePriceVersionDto[]): SalePriceVersionDto {
  const first = rows[0];
  if (!first) {
    throw new NotFoundException('Sale price version could not be read back.');
  }
  return first;
}
