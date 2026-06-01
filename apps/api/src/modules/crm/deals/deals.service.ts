import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { attachDealHandoffReferences } from './deal-handoff';
import {
  dealCreateInclude,
  dealDetailInclude,
  dealListInclude,
  dealUpdateInclude,
} from './deal.includes';
import type { CreateDealDto, DealForHandoff, DealQueryParams, UpdateDealDto } from './deal.types';
import { DealWonHandler } from './deal-won.handler';
import { isDealAttributionLocked } from '@nbos/shared';
import { assertAttributionUpdateAllowed, type AttributionForValidation } from '../attribution-gate';
import { validateDealStageGate } from './deal-stage-gate';
import { validateDealWonGate } from './deal-won-gate';
import { assertDealSellerRefs, validateDealCreate } from './deal-create-validation';
import { resolveDealCreateDefaults } from './deal-create-defaults.op';
import {
  dealNeedsPartnerReferralTerms,
  patchPartnerReferralTerms as persistPartnerReferralTerms,
  syncPartnerReferralTermsForDeal,
  type PartnerReferralTermsDealSnapshot,
  type PatchPartnerReferralTermsBody,
} from './partner-referral-terms.ops';
import { assertPartnerAssignableForInboundCrm } from '../../partners/partner-crm-source.ops';
import { syncEntityContactLinks } from '../shared/sync-entity-contact-links.ops';
import { resolveSortField, normalizeSortDirection } from '../../../common/utils/sort-order';

const DEAL_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'name', 'code', 'status', 'amount']);

@Injectable()
export class DealsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly dealWonHandler: DealWonHandler,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: DealQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      type,
      sellerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.DealWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumDealStatusEnumFilter['equals'];
    }
    if (type) {
      where.type = type as Prisma.EnumDealTypeEnumFilter['equals'];
    }
    if (sellerId) {
      where.sellerId = sellerId;
    }
    if (search?.trim()) {
      const q = search.trim();
      const ic = { contains: q, mode: 'insensitive' as const };
      where.OR = [
        { code: ic },
        { name: ic },
        { contact: { firstName: ic } },
        { contact: { lastName: ic } },
        { contact: { email: ic } },
        { company: { name: ic } },
        { lead: { code: ic } },
        { lead: { contactName: ic } },
        { existingProduct: { name: ic } },
        { sourcePartner: { name: ic } },
        { sourceContact: { firstName: ic } },
        { sourceContact: { lastName: ic } },
        { marketingAccount: { name: ic } },
        { marketingActivity: { title: ic } },
        { orders: { some: { code: ic } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: dealListInclude,
        orderBy: {
          [resolveSortField(sortBy, DEAL_SORT_FIELDS, 'createdAt')]:
            normalizeSortDirection(sortOrder),
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deal.count({ where }),
    ]);

    const itemsWithHandoff = await Promise.all(
      items.map(async (deal) => this.enrichDealForClient(await this.attachHandoffReferences(deal))),
    );

    return {
      items: itemsWithHandoff,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: dealDetailInclude,
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${id} not found`);
    }
    return this.enrichDealForClient(await this.attachHandoffReferences(deal));
  }

  async create(data: CreateDealDto, meta: { actorId?: string; actorRoleLevel?: number } = {}) {
    const resolved = await resolveDealCreateDefaults(this.prisma, data, meta);
    await validateDealCreate(this.prisma, resolved);
    if (resolved.source === 'PARTNER' || resolved.sourcePartnerId) {
      await assertPartnerAssignableForInboundCrm(
        this.prisma,
        resolved.source ?? null,
        resolved.sourcePartnerId,
        meta.actorRoleLevel,
      );
    }
    const code = await this.generateCode();
    const deal = await this.prisma.deal.create({
      data: {
        code,
        name: resolved.name,
        leadId: resolved.leadId,
        ...(resolved.contactId && { contactId: resolved.contactId }),
        ...(resolved.type && { type: resolved.type as Prisma.DealCreateInput['type'] }),
        amount: resolved.amount,
        ...(resolved.paymentType && {
          paymentType: resolved.paymentType as Prisma.DealCreateInput['paymentType'],
        }),
        ...(resolved.taxStatus && {
          taxStatus: resolved.taxStatus as Prisma.DealCreateInput['taxStatus'],
        }),
        companyId: resolved.companyId ?? undefined,
        sellerId: resolved.sellerId!,
        sellerAssistantId: resolved.sellerAssistantId?.trim() || undefined,
        source: resolved.source as Prisma.DealCreateInput['source'],
        sourceDetail: resolved.sourceDetail,
        sourcePartnerId: resolved.sourcePartnerId,
        sourceContactId: resolved.sourceContactId,
        marketingAccountId: resolved.marketingAccountId,
        marketingActivityId: resolved.marketingActivityId,
        notes: resolved.notes,
        productCategory:
          (resolved.productCategory as Prisma.DealCreateInput['productCategory']) ?? undefined,
        productType: resolved.productType ?? undefined,
        pmId: resolved.pmId ?? undefined,
        deadline: resolved.deadline ? new Date(resolved.deadline) : undefined,
        existingProductId: resolved.existingProductId ?? undefined,
        offerSentAt: resolved.offerSentAt ? new Date(resolved.offerSentAt) : undefined,
        offerLink: resolved.offerLink,
        offerFileUrl: resolved.offerFileUrl,
        offerScreenshotUrl: resolved.offerScreenshotUrl,
        contractSignedAt: resolved.contractSignedAt
          ? new Date(resolved.contractSignedAt)
          : undefined,
        contractFileUrl: resolved.contractFileUrl,
        maintenanceStartAt: resolved.maintenanceStartAt
          ? new Date(resolved.maintenanceStartAt)
          : undefined,
      },
      include: dealCreateInclude,
    });
    if (meta.actorId) {
      await this.auditService.log({
        entityType: 'DEAL',
        entityId: deal.id,
        action: 'DEAL_CREATED',
        userId: meta.actorId,
        changes: {
          code: deal.code,
          withoutPriorLead: !resolved.leadId?.trim(),
          type: resolved.type,
        },
      });
    }
    const termsSnapshot = this.partnerTermsSnapshot(deal);
    if (termsSnapshot) {
      await syncPartnerReferralTermsForDeal(this.prisma, deal.id, termsSnapshot);
    }
    const withTerms = await this.prisma.deal.findUnique({
      where: { id: deal.id },
      include: dealCreateInclude,
    });
    if (!withTerms) {
      throw new NotFoundException(`Deal ${deal.id} not found after create`);
    }
    return this.enrichDealForClient(await this.attachHandoffReferences(withTerms));
  }

  async update(id: string, data: UpdateDealDto, meta: { actorRoleLevel?: number } = {}) {
    const existing = await this.findById(id);
    const nextSource = data.source !== undefined ? data.source : existing.source;
    const nextPartnerId =
      data.sourcePartnerId !== undefined ? data.sourcePartnerId : existing.sourcePartnerId;
    if (data.source !== undefined || data.sourcePartnerId !== undefined) {
      await assertPartnerAssignableForInboundCrm(
        this.prisma,
        nextSource,
        nextPartnerId,
        meta.actorRoleLevel,
      );
    }
    const nextStatus = data.status ?? existing.status;
    const attributionLocked = isDealAttributionLocked(nextStatus);
    const attributionPatch = buildDealAttributionPatch(data);
    assertAttributionUpdateAllowed({
      context: 'Deal',
      before: pickDealAttribution(existing),
      patch: attributionPatch,
      locked: attributionLocked,
    });

    const nextSellerId = data.sellerId ?? existing.sellerId;
    const nextAssistantId =
      data.sellerAssistantId !== undefined ? data.sellerAssistantId : existing.sellerAssistantId;
    if (data.sellerId !== undefined || data.sellerAssistantId !== undefined) {
      await assertDealSellerRefs(this.prisma, {
        sellerId: nextSellerId,
        sellerAssistantId: nextAssistantId,
      });
    }

    let resolvedContactId =
      data.contactId !== undefined ? data.contactId : (existing.contact?.id ?? null);

    if (data.contactIds !== undefined) {
      const { primaryContactId } = await syncEntityContactLinks(
        this.prisma,
        'deal',
        id,
        data.contactIds,
      );
      resolvedContactId = primaryContactId;
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status && { status: data.status as Prisma.DealUpdateInput['status'] }),
        ...(data.type && { type: data.type as Prisma.DealUpdateInput['type'] }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.paymentType && {
          paymentType: data.paymentType as Prisma.DealUpdateInput['paymentType'],
        }),
        ...(data.taxStatus && { taxStatus: data.taxStatus as Prisma.DealUpdateInput['taxStatus'] }),
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.sellerId !== undefined && { sellerId: data.sellerId }),
        ...(data.sellerAssistantId !== undefined && {
          sellerAssistantId: data.sellerAssistantId,
        }),
        ...((data.contactIds !== undefined || data.contactId !== undefined) && {
          contactId: data.contactIds !== undefined ? resolvedContactId : data.contactId,
        }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.source !== undefined && {
          source: data.source ? (data.source as Prisma.DealUpdateInput['source']) : null,
        }),
        ...(data.sourceDetail !== undefined && { sourceDetail: data.sourceDetail }),
        ...(data.sourcePartnerId !== undefined && { sourcePartnerId: data.sourcePartnerId }),
        ...(data.sourceContactId !== undefined && { sourceContactId: data.sourceContactId }),
        ...(data.marketingAccountId !== undefined && {
          marketingAccountId: data.marketingAccountId,
        }),
        ...(data.marketingActivityId !== undefined && {
          marketingActivityId: data.marketingActivityId,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.productCategory !== undefined && {
          productCategory: data.productCategory as Prisma.DealUpdateInput['productCategory'],
        }),
        ...(data.productType !== undefined && { productType: data.productType }),
        ...(data.pmId !== undefined && { pmId: data.pmId }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.existingProductId !== undefined && {
          existingProductId: data.existingProductId,
        }),
        ...(data.offerSentAt !== undefined && {
          offerSentAt: data.offerSentAt ? new Date(data.offerSentAt) : null,
        }),
        ...(data.offerLink !== undefined && { offerLink: data.offerLink }),
        ...(data.offerFileUrl !== undefined && { offerFileUrl: data.offerFileUrl }),
        ...(data.offerScreenshotUrl !== undefined && {
          offerScreenshotUrl: data.offerScreenshotUrl,
        }),
        ...(data.contractSignedAt !== undefined && {
          contractSignedAt: data.contractSignedAt ? new Date(data.contractSignedAt) : null,
        }),
        ...(data.contractFileUrl !== undefined && { contractFileUrl: data.contractFileUrl }),
        ...(data.maintenanceStartAt !== undefined && {
          maintenanceStartAt: data.maintenanceStartAt ? new Date(data.maintenanceStartAt) : null,
        }),
      },
      include: dealUpdateInclude,
    });

    const termsSnapshot = this.partnerTermsSnapshot(deal);
    if (termsSnapshot) {
      await syncPartnerReferralTermsForDeal(this.prisma, id, termsSnapshot);
    }
    const refreshed = await this.prisma.deal.findUnique({
      where: { id },
      include: dealUpdateInclude,
    });
    if (!refreshed) {
      throw new NotFoundException(`Deal ${id} not found after update`);
    }
    return this.enrichDealForClient(await this.attachHandoffReferences(refreshed));
  }

  async patchPartnerReferralTerms(dealId: string, body: PatchPartnerReferralTermsBody) {
    await persistPartnerReferralTerms(this.prisma, dealId, body);
    return this.findById(dealId);
  }

  async updateStatus(id: string, status: string) {
    let current = await this.findById(id);
    if (current.status === status) {
      return current;
    }
    this.assertStatusTransitionAllowed(current.status, status);

    if (dealNeedsPartnerReferralTerms(current)) {
      const termsSnapshot = this.partnerTermsSnapshot(current);
      if (termsSnapshot) {
        await syncPartnerReferralTermsForDeal(this.prisma, id, termsSnapshot);
      }
      current = await this.findById(id);
    }

    const [linkedOfferAssetCount, linkedContractAssetCount] = await Promise.all([
      this.countLinkedDealAssets(id, ['OFFER']),
      this.countLinkedDealAssets(id, ['CONTRACT']),
    ]);
    validateDealStageGate({ ...current, linkedOfferAssetCount, linkedContractAssetCount }, status);
    if (status === 'WON') {
      validateDealWonGate(current);
    }

    const deal = await this.update(id, { status });

    if (status === 'WON') {
      await this.prisma.deal.update({
        where: { id },
        data: { wonMode: current.wonMode ?? 'STANDARD' },
      });
      await this.dealWonHandler.handle(deal);
      return this.findById(id);
    }

    return deal;
  }

  private assertStatusTransitionAllowed(currentStatus: string, targetStatus: string): void {
    if (currentStatus === 'WON' && targetStatus !== 'WON') {
      throw new BadRequestException({
        statusCode: 400,
        code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        message: 'Deal Won is a closed outcome and cannot be moved back.',
        errors: [
          {
            field: 'status',
            message: 'Won deals may have Orders, Projects and Finance records attached.',
          },
        ],
      });
    }
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.deal.delete({ where: { id } });
  }

  async getStats() {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.deal.count(),
      this.prisma.deal.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.deal.groupBy({
        by: ['type'],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return { total, byStatus, byType };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastDeal = await this.prisma.deal.findFirst({
      where: { code: { startsWith: `D-${year}-` } },
      orderBy: { code: 'desc' },
    });

    const nextNum = lastDeal ? parseInt(lastDeal.code.split('-')[2] ?? '0', 10) + 1 : 1;

    return `D-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private partnerTermsSnapshot(deal: {
    source: string | null;
    sourcePartnerId: string | null;
    type: string | null;
    paymentType: string | null;
  }): PartnerReferralTermsDealSnapshot | null {
    if (!deal.type) return null;
    return {
      source: deal.source,
      sourcePartnerId: deal.sourcePartnerId,
      type: deal.type as PartnerReferralTermsDealSnapshot['type'],
      paymentType: deal.paymentType as PartnerReferralTermsDealSnapshot['paymentType'],
    };
  }

  private async countLinkedDealAssets(
    dealId: string,
    purposes: Array<'OFFER' | 'CONTRACT'>,
  ): Promise<number> {
    return this.prisma.fileLink.count({
      where: {
        entityType: 'DEAL',
        entityId: dealId,
        unlinkedAt: null,
        fileAsset: {
          deletedAt: null,
          archivedAt: null,
          purpose: { in: purposes },
        },
      },
    });
  }

  private attachHandoffReferences<T extends DealForHandoff>(deal: T) {
    return attachDealHandoffReferences(this.prisma, deal);
  }

  private async enrichDealForClient<T extends { id: string }>(
    deal: T,
  ): Promise<T & { linkedOfferAssetCount: number; linkedContractAssetCount: number }> {
    const [linkedOfferAssetCount, linkedContractAssetCount] = await Promise.all([
      this.countLinkedDealAssets(deal.id, ['OFFER']),
      this.countLinkedDealAssets(deal.id, ['CONTRACT']),
    ]);
    return { ...deal, linkedOfferAssetCount, linkedContractAssetCount };
  }
}

function pickDealAttribution(deal: {
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}): AttributionForValidation {
  return {
    source: deal.source,
    sourceDetail: deal.sourceDetail,
    sourcePartnerId: deal.sourcePartnerId,
    sourceContactId: deal.sourceContactId,
    marketingAccountId: deal.marketingAccountId,
    marketingActivityId: deal.marketingActivityId,
  };
}

function buildDealAttributionPatch(data: UpdateDealDto): Partial<AttributionForValidation> {
  const patch: Partial<AttributionForValidation> = {};
  if (data.source !== undefined) patch.source = data.source ?? null;
  if (data.sourceDetail !== undefined) patch.sourceDetail = data.sourceDetail;
  if (data.sourcePartnerId !== undefined) patch.sourcePartnerId = data.sourcePartnerId;
  if (data.sourceContactId !== undefined) patch.sourceContactId = data.sourceContactId;
  if (data.marketingAccountId !== undefined) patch.marketingAccountId = data.marketingAccountId;
  if (data.marketingActivityId !== undefined) {
    patch.marketingActivityId = data.marketingActivityId;
  }
  return patch;
}
