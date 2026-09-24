import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  frozenDeliveryAxes,
  normalizeStoredVolumeFactor,
  parseDealQuoteApplyCollectionBody,
  parseDealQuoteBody,
  VOLUME_FACTOR_STANDARD,
  type DealQuoteWriteInput,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { copyDealQuoteExtras } from './copy-deal-quote-extras';
import { findPublishedCoreId } from './match-published-core';
import { quoteAxesForPreview, type DealQuotePreview } from './quote-core-lookup';

export type DealQuoteDto = {
  dealId: string;
  appliedCollectionId: string | null;
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
  coreProfileVersionId: string | null;
  coreVolumeFactor: string;
  coreVolumeReason: string | null;
  items: Array<{
    functionId: string;
    tierId: string | null;
    volumeFactor: string;
    volumeReason: string | null;
  }>;
};

type DealRef = {
  id: string;
  status: string;
  productType: string | null;
  productCategory: string | null;
};

/**
 * Draft composition on a deal until Won. A collection click replaces extras. The quote never
 * overwrites the deal amount; sale totals are computed by the client from catalog prices.
 */
@Injectable()
export class DealQuoteService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async get(dealId: string, preview: DealQuotePreview | null = null): Promise<DealQuoteDto> {
    const deal = await this.requireDeal(dealId);
    const row = await this.prisma.deliveryDealQuote.findUnique({
      where: { dealId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    return this.toQuoteDto(deal, row ? toDto(row) : emptyQuote(dealId), preview);
  }

  async replace(dealId: string, body: unknown): Promise<DealQuoteDto> {
    const deal = await this.requireOpenDeal(dealId);
    const input = parseDealQuoteBody(body);
    await this.assertQuoteItems(input.items);
    return this.write(deal, input);
  }

  async applyCollection(dealId: string, body: unknown): Promise<DealQuoteDto> {
    const deal = await this.requireOpenDeal(dealId);
    const { collectionId } = parseDealQuoteApplyCollectionBody(body);
    const collection = await this.prisma.deliveryFunctionCollection.findUnique({
      where: { id: collectionId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!collection) {
      throw new NotFoundException(`Collection ${collectionId} not found`);
    }
    if (deal.productType && collection.productType !== deal.productType) {
      throw new BadRequestException('Collection does not match the deal product type.');
    }
    const current = await this.prisma.deliveryDealQuote.findUnique({
      where: { dealId },
      include: { items: true },
    });
    const kept = new Map((current?.items ?? []).map((item) => [item.functionId, item]));
    return this.write(deal, {
      ...frozenDeliveryAxes(),
      volumeFactor: storedFactor(current?.coreVolumeFactor),
      volumeReason: current?.coreVolumeReason ?? null,
      appliedCollectionId: collection.id,
      items: collection.items.map((item) => ({
        functionId: item.functionId,
        tierId: null,
        volumeFactor: storedFactor(kept.get(item.functionId)?.volumeFactor),
        volumeReason: kept.get(item.functionId)?.volumeReason ?? null,
      })),
    });
  }

  async copyExtrasToConfiguration(
    productId: string,
    configurationId: string,
    orderId?: string,
  ): Promise<void> {
    await copyDealQuoteExtras(this.prisma, productId, configurationId, orderId);
  }

  private async write(deal: DealRef, input: DealQuoteWriteInput): Promise<DealQuoteDto> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.deliveryDealQuote.upsert({
        where: { dealId: deal.id },
        create: {
          dealId: deal.id,
          appliedCollectionId: input.appliedCollectionId,
          coreVolumeFactor: input.volumeFactor,
          coreVolumeReason: input.volumeReason,
          ...frozenDeliveryAxes(),
        },
        update: {
          appliedCollectionId: input.appliedCollectionId,
          coreVolumeFactor: input.volumeFactor,
          coreVolumeReason: input.volumeReason,
          ...frozenDeliveryAxes(),
        },
      });
      const quote = await tx.deliveryDealQuote.findUniqueOrThrow({ where: { dealId: deal.id } });
      await tx.deliveryDealQuoteItem.deleteMany({ where: { quoteId: quote.id } });
      if (input.items.length > 0) {
        await tx.deliveryDealQuoteItem.createMany({
          data: input.items.map((item, index) => ({
            quoteId: quote.id,
            functionId: item.functionId,
            tierId: item.tierId,
            volumeFactor: item.volumeFactor,
            volumeReason: item.volumeReason,
            position: index + 1,
          })),
        });
      }
      return tx.deliveryDealQuote.findUniqueOrThrow({
        where: { dealId: deal.id },
        include: { items: { orderBy: { position: 'asc' } } },
      });
    });
    return this.toQuoteDto(deal, toDto(row));
  }

  private async toQuoteDto(
    deal: DealRef,
    quote: DealQuoteDto,
    preview: DealQuotePreview | null = null,
  ): Promise<DealQuoteDto> {
    const axes = quoteAxesForPreview(deal, preview);
    return {
      ...quote,
      appliedCollectionId: axes.hideSavedExtras ? null : quote.appliedCollectionId,
      items: axes.hideSavedExtras ? [] : quote.items,
      coreProfileVersionId: await findPublishedCoreId(this.prisma, {
        productType: axes.productType,
      }),
    };
  }

  private async requireOpenDeal(dealId: string): Promise<DealRef> {
    const deal = await this.requireDeal(dealId);
    if (deal.status === 'WON') {
      throw new BadRequestException('The deal quote is frozen after Won.');
    }
    return deal;
  }

  private async requireDeal(dealId: string): Promise<DealRef> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, status: true, productType: true, productCategory: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }
    return deal;
  }

  private async assertQuoteItems(
    items: ReadonlyArray<{ functionId: string; tierId: string | null }>,
  ): Promise<void> {
    if (items.length === 0) return;
    const functionIds = items.map((item) => item.functionId);
    const found = await this.prisma.deliveryFunction.count({
      where: { id: { in: [...functionIds] } },
    });
    if (found !== functionIds.length) {
      throw new BadRequestException('A quote references a function that does not exist.');
    }
    await this.assertTiersBelongToFunctions(items);
  }

  private async assertTiersBelongToFunctions(
    items: ReadonlyArray<{ functionId: string; tierId: string | null }>,
  ): Promise<void> {
    const withTiers = items.filter(
      (item): item is { functionId: string; tierId: string } => item.tierId !== null,
    );
    if (withTiers.length === 0) return;
    const tiers = await this.prisma.deliveryFunctionTier.findMany({
      where: { id: { in: withTiers.map((item) => item.tierId) } },
      select: { id: true, functionId: true },
    });
    const owner = new Map(tiers.map((tier) => [tier.id, tier.functionId]));
    if (withTiers.some((item) => owner.get(item.tierId) !== item.functionId)) {
      throw new BadRequestException('A quote tier does not belong to its function.');
    }
  }
}

function emptyQuote(dealId: string): DealQuoteDto {
  return {
    dealId,
    appliedCollectionId: null,
    ...frozenDeliveryAxes(),
    coreProfileVersionId: null,
    coreVolumeFactor: VOLUME_FACTOR_STANDARD,
    coreVolumeReason: null,
    items: [],
  };
}

function toDto(row: {
  dealId: string;
  appliedCollectionId: string | null;
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
  coreVolumeFactor: { toString(): string } | string;
  coreVolumeReason: string | null;
  items: Array<{
    functionId: string;
    tierId: string | null;
    volumeFactor: { toString(): string } | string;
    volumeReason: string | null;
  }>;
}): DealQuoteDto {
  return {
    dealId: row.dealId,
    appliedCollectionId: row.appliedCollectionId,
    implementationBase: row.implementationBase,
    designMode: row.designMode,
    aiDesignerReview: row.aiDesignerReview,
    coreProfileVersionId: null,
    coreVolumeFactor: storedFactor(row.coreVolumeFactor),
    coreVolumeReason: row.coreVolumeReason,
    items: row.items.map((item) => ({
      functionId: item.functionId,
      tierId: item.tierId,
      volumeFactor: storedFactor(item.volumeFactor),
      volumeReason: item.volumeReason,
    })),
  };
}

function storedFactor(value: { toString(): string } | string | null | undefined): string {
  if (value === null || value === undefined) return VOLUME_FACTOR_STANDARD;
  const text = typeof value === 'string' ? value : value.toString();
  return normalizeStoredVolumeFactor(text);
}
