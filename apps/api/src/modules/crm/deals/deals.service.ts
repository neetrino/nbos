import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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
import type { CreateDealDto, DealQueryParams, UpdateDealDto } from './deal.types';
import { DealWonHandler } from './deal-won.handler';
import { validateDealStageGate } from './deal-stage-gate';
import { type DealWonOverrideContext, validateDealWonGate } from './deal-won-gate';

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
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: dealListInclude,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deal.count({ where }),
    ]);

    const itemsWithHandoff = await Promise.all(
      items.map((deal) => this.attachHandoffReferences(deal)),
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
    return this.attachHandoffReferences(deal);
  }

  async create(data: CreateDealDto) {
    const code = await this.generateCode();
    const deal = await this.prisma.deal.create({
      data: {
        code,
        name: data.name,
        leadId: data.leadId,
        contactId: data.contactId,
        type: data.type as Prisma.DealCreateInput['type'],
        amount: data.amount,
        paymentType: data.paymentType as Prisma.DealCreateInput['paymentType'],
        taxStatus: (data.taxStatus as Prisma.DealCreateInput['taxStatus']) ?? 'TAX',
        companyId: data.companyId ?? undefined,
        sellerId: data.sellerId,
        source: data.source as Prisma.DealCreateInput['source'],
        sourceDetail: data.sourceDetail,
        sourcePartnerId: data.sourcePartnerId,
        sourceContactId: data.sourceContactId,
        marketingAccountId: data.marketingAccountId,
        marketingActivityId: data.marketingActivityId,
        notes: data.notes,
        productCategory:
          (data.productCategory as Prisma.DealCreateInput['productCategory']) ?? undefined,
        productType: data.productType ?? undefined,
        pmId: data.pmId ?? undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        existingProductId: data.existingProductId ?? undefined,
        offerSentAt: data.offerSentAt ? new Date(data.offerSentAt) : undefined,
        offerLink: data.offerLink,
        offerFileUrl: data.offerFileUrl,
        offerScreenshotUrl: data.offerScreenshotUrl,
        responseDueAt: data.responseDueAt ? new Date(data.responseDueAt) : undefined,
        contractSignedAt: data.contractSignedAt ? new Date(data.contractSignedAt) : undefined,
        contractFileUrl: data.contractFileUrl,
        maintenanceStartAt: data.maintenanceStartAt ? new Date(data.maintenanceStartAt) : undefined,
      },
      include: dealCreateInclude,
    });
    return this.attachHandoffReferences(deal);
  }

  async update(id: string, data: UpdateDealDto) {
    await this.findById(id);

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
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.source && { source: data.source as Prisma.DealUpdateInput['source'] }),
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
        ...(data.responseDueAt !== undefined && {
          responseDueAt: data.responseDueAt ? new Date(data.responseDueAt) : null,
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
    return this.attachHandoffReferences(deal);
  }

  async updateStatus(id: string, status: string, override: DealWonOverrideContext = {}) {
    const current = await this.findById(id);
    if (current.status === status) {
      return current;
    }

    validateDealStageGate(current, status);
    if (status === 'WON') {
      validateDealWonGate(current, override);
    }

    const deal = await this.update(id, {
      status,
      ...(status === 'WON' && override.reason?.trim()
        ? { notes: this.appendOverrideNote(current.notes, override.reason.trim()) }
        : {}),
    });

    if (status === 'WON') {
      if (override.reason?.trim() && override.actorId) {
        await this.auditService.log({
          entityType: 'DEAL',
          entityId: id,
          action: 'DEAL_WON_OVERRIDE',
          userId: override.actorId,
          changes: { reason: override.reason.trim() },
        });
      }
      await this.dealWonHandler.handle(deal);
      return this.findById(id);
    }

    return deal;
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

  private appendOverrideNote(notes: string | null, reason: string): string {
    const line = `Deal Won override reason: ${reason}`;
    return notes ? `${notes}\n${line}` : line;
  }

  private attachHandoffReferences<T extends Parameters<typeof attachDealHandoffReferences>[1]>(
    deal: T,
  ) {
    return attachDealHandoffReferences(this.prisma, deal);
  }
}
