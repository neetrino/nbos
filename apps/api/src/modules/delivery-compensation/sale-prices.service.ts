import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  DEFAULT_SALE_MULTIPLIER,
  parseSalePriceBody,
  salePriceTargetKey,
  type SalePriceTarget,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { DELIVERY_RUNTIME_SETTING_ID } from './delivery-compensation-rules.service';

export type SalePriceVersionDto = {
  id: string;
  targetKey: string;
  version: number;
  status: string;
  effectiveFrom: string;
  multiplier: string | null;
  fixedAmount: string | null;
  currency: string;
};

const FIRST_VERSION = 1;

/**
 * Sale prices of catalog items. This is what a client pays, not what a team is paid: publishing a
 * sale price cannot change anybody's bonus. Versioned all the same, so a price change never re-prices
 * a deal that was already assembled.
 */
@Injectable()
export class SalePricesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(targetKey?: string): Promise<SalePriceVersionDto[]> {
    const rows = await this.prisma.deliverySalePriceVersion.findMany({
      where: targetKey ? { targetKey } : {},
      orderBy: [{ targetKey: 'asc' }, { version: 'desc' }],
    });
    return rows.map(serializeSalePrice);
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
        multiplier: input.multiplier,
        fixedAmount: input.fixedAmount,
      },
    });
    return serializeSalePrice(created);
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
    return serializeSalePrice(published);
  }

  async defaultMultiplier(): Promise<string> {
    const setting = await this.prisma.deliveryCompensationRuntimeSetting.findUnique({
      where: { id: DELIVERY_RUNTIME_SETTING_ID },
      select: { defaultSaleMultiplier: true },
    });
    return setting?.defaultSaleMultiplier?.toString() ?? DEFAULT_SALE_MULTIPLIER;
  }

  async setDefaultMultiplier(raw: unknown): Promise<{ defaultSaleMultiplier: string }> {
    const parsed = parseSalePriceBody(
      { multiplier: raw, effectiveFrom: new Date().toISOString() },
      { kind: 'FUNCTION', functionId: 'default' },
    );
    if (parsed.multiplier === null) {
      throw new BadRequestException('A default sale multiplier is required.');
    }
    const setting = await this.prisma.deliveryCompensationRuntimeSetting.upsert({
      where: { id: DELIVERY_RUNTIME_SETTING_ID },
      create: { id: DELIVERY_RUNTIME_SETTING_ID, defaultSaleMultiplier: parsed.multiplier },
      update: { defaultSaleMultiplier: parsed.multiplier },
    });
    return { defaultSaleMultiplier: setting.defaultSaleMultiplier.toString() };
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

function serializeSalePrice(row: {
  id: string;
  targetKey: string;
  version: number;
  status: string;
  effectiveFrom: Date;
  multiplier: { toString(): string } | null;
  fixedAmount: { toString(): string } | null;
  currency: string;
}): SalePriceVersionDto {
  return {
    id: row.id,
    targetKey: row.targetKey,
    version: row.version,
    status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString(),
    multiplier: row.multiplier?.toString() ?? null,
    fixedAmount: row.fixedAmount?.toString() ?? null,
    currency: row.currency,
  };
}
