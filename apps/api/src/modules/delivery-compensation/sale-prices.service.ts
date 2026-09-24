import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  parseSalePriceBody,
  parseSalePricePatchBody,
  resolveSalePrice,
  salePriceTargetKey,
  type SalePriceTarget,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
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
 * Sale amount of a function, a gradation, or a core. This is the whole price the client pays for
 * that card, not a rate per unit and not what a team is paid. Publishing it cannot change a bonus.
 * Versioned all the same, so a later edit never re-prices a deal that was already assembled.
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
    const created = await this.prisma.$transaction(
      async (tx) => {
        const open = await tx.deliverySalePriceVersion.findFirst({
          where: { targetKey, status: 'DRAFT' },
          select: { id: true },
        });
        if (open) {
          return tx.deliverySalePriceVersion.update({
            where: { id: open.id },
            data: { amountPerUnit: input.amountPerUnit },
          });
        }
        const last = await tx.deliverySalePriceVersion.findFirst({
          where: { targetKey },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        return tx.deliverySalePriceVersion.create({
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
      },
      { isolationLevel: 'Serializable' },
    );
    return requiredSerialized(this.serializeMany([created], true));
  }

  async updateDraft(id: string, body: unknown): Promise<SalePriceVersionDto> {
    const input = parseSalePricePatchBody(body);
    const version = await this.prisma.deliverySalePriceVersion.findUnique({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Sale price version ${id} not found`);
    }
    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft sale price can be updated.');
    }
    const updated = await this.prisma.deliverySalePriceVersion.update({
      where: { id },
      data: { amountPerUnit: input.amountPerUnit },
    });
    return requiredSerialized(this.serializeMany([updated], true));
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
    return requiredSerialized(this.serializeMany([published], true));
  }

  private serializeMany(
    rows: readonly SalePriceRecord[],
    includeRate: boolean,
  ): SalePriceVersionDto[] {
    return rows.map((row) => serializeSalePrice(row, includeRate));
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

function serializeSalePrice(row: SalePriceRecord, includeRate: boolean): SalePriceVersionDto {
  const amountPerUnit = row.amountPerUnit.toString();
  return {
    id: row.id,
    targetKey: row.targetKey,
    version: row.version,
    status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString(),
    amountPerUnit: includeRate ? amountPerUnit : null,
    resolvedAmount: resolveSalePrice({ amount: amountPerUnit }).amount,
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
