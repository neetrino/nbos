import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  parsePartnerDirectionForWrite,
  parsePartnerLevelForWrite,
  parsePartnerStatusForWrite,
  resolvePartnerDirectionFilter,
  resolvePartnerLevelFilter,
  resolvePartnerStatusFilter,
  serializePartner,
  type PartnerWireDto,
} from './partners-wire';
import {
  applyPartnerCommissionPolicy,
  loadPartnerCommissionPolicyView,
  type CommissionPolicyRowInput,
  type PartnerCommissionPolicyViewDto,
} from './partner-commission-policy.ops';
import {
  loadPartnerAccrualBalance,
  type PartnerAccrualBalanceDto,
} from './partner-accrual-balance.ops';
import {
  approvePartnerPayoutBatch,
  cancelPartnerPayoutBatch,
  createPartnerPayoutBatch,
  listPartnerPayoutBatches,
  type ApprovePartnerPayoutBatchInput,
  type CancelPartnerPayoutBatchInput,
  type CreatePartnerPayoutBatchInput,
  type PartnerPayoutBatchDto,
} from './partner-payout-batch.ops';
import {
  createPartnerServiceTerm,
  listPartnerServiceTerms,
  updatePartnerServiceTerm,
  type CreatePartnerServiceTermInput,
  type PartnerServiceTermWireDto,
  type UpdatePartnerServiceTermInput,
} from './partner-service-terms.ops';

interface PartnerQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  /** NBOS wire: partner tier (REGULAR | PREMIUM). */
  level?: string;
  /** @deprecated Use `level`. Alias for Prisma `Partner.type`. */
  type?: string;
  direction?: string;
}

interface CreatePartnerDto {
  name: string;
  level?: string;
  /** @deprecated Use `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

interface UpdatePartnerDto {
  name?: string;
  level?: string;
  /** @deprecated Use `level`. */
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

const PARTNER_INCLUDE = {
  _count: { select: { subscriptions: true, orders: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PartnerInclude;

@Injectable()
export class PartnersService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  private assertDefaultPercentInRange(value: number): number {
    if (Number.isNaN(value) || value < 0 || value > 100) {
      throw new BadRequestException('defaultPercent must be a number from 0 to 100');
    }
    return value;
  }

  async findAll(params: PartnerQueryParams) {
    const { page = 1, pageSize = 20, search, status, level, type, direction } = params;
    const where: Prisma.PartnerWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const statusFilter = resolvePartnerStatusFilter(status);
    if (statusFilter) where.status = statusFilter;
    const levelFilter = resolvePartnerLevelFilter(level, type);
    if (levelFilter) where.type = levelFilter;
    const directionFilter = resolvePartnerDirectionFilter(direction);
    if (directionFilter) where.direction = directionFilter;

    const [rows, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        include: PARTNER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.partner.count({ where }),
    ]);

    return {
      items: rows.map(serializePartner),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string): Promise<PartnerWireDto> {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: PARTNER_INCLUDE,
    });
    if (!partner) throw new NotFoundException(`Partner ${id} not found`);
    return serializePartner(partner);
  }

  async create(data: CreatePartnerDto): Promise<PartnerWireDto> {
    const defaultPercent =
      data.defaultPercent === undefined
        ? 30
        : this.assertDefaultPercentInRange(data.defaultPercent);

    const tier = parsePartnerLevelForWrite(data.level, data.type) ?? 'REGULAR';
    const dir = parsePartnerDirectionForWrite(data.direction) ?? 'INBOUND';
    const st = parsePartnerStatusForWrite(data.status) ?? 'ACTIVE';

    const row = await this.prisma.partner.create({
      data: {
        name: data.name,
        type: tier,
        direction: dir,
        defaultPercent,
        status: st,
        contactId: data.contactId,
      },
      include: PARTNER_INCLUDE,
    });
    return serializePartner(row);
  }

  async update(id: string, data: UpdatePartnerDto): Promise<PartnerWireDto> {
    await this.findById(id);

    const defaultPercent =
      data.defaultPercent === undefined
        ? undefined
        : this.assertDefaultPercentInRange(data.defaultPercent);

    const nextLevel =
      data.level !== undefined || data.type !== undefined
        ? parsePartnerLevelForWrite(data.level, data.type)
        : undefined;
    const nextDirection =
      data.direction !== undefined ? parsePartnerDirectionForWrite(data.direction) : undefined;
    const nextStatus =
      data.status !== undefined ? parsePartnerStatusForWrite(data.status) : undefined;

    const row = await this.prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(nextLevel !== undefined && { type: nextLevel }),
        ...(nextDirection !== undefined && { direction: nextDirection }),
        ...(defaultPercent !== undefined && { defaultPercent }),
        ...(nextStatus !== undefined && { status: nextStatus }),
        ...(data.contactId !== undefined && { contactId: data.contactId || null }),
      },
      include: PARTNER_INCLUDE,
    });
    return serializePartner(row);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.partner.delete({ where: { id } });
  }

  /** NBOS § Partner Commission Policy: percents by deal type; null row uses partner defaultPercent. */
  async getCommissionPolicy(partnerId: string): Promise<PartnerCommissionPolicyViewDto> {
    return loadPartnerCommissionPolicyView(this.prisma, partnerId);
  }

  async putCommissionPolicy(
    partnerId: string,
    body: { rows: CommissionPolicyRowInput[] },
  ): Promise<PartnerCommissionPolicyViewDto> {
    return applyPartnerCommissionPolicy(this.prisma, partnerId, body.rows);
  }

  /** NBOS § Partner Payouts — roll-up by accrual status (payout batch not required for read). */
  async getPartnerAccrualBalance(partnerId: string): Promise<PartnerAccrualBalanceDto> {
    await this.findById(partnerId);
    return loadPartnerAccrualBalance(this.prisma, partnerId);
  }

  /** NBOS § Partner Payouts — inbound accruals list (classic + subscription rows). */
  async listPartnerAccruals(partnerId: string) {
    await this.findById(partnerId);
    const rows = await this.prisma.partnerAccrual.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        orderId: true,
        projectId: true,
        productId: true,
        subscriptionId: true,
        paymentId: true,
        invoiceId: true,
        dealType: true,
        paymentType: true,
        baseAmount: true,
        percent: true,
        amount: true,
        status: true,
        eligibleAt: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      projectId: r.projectId,
      productId: r.productId,
      subscriptionId: r.subscriptionId,
      paymentId: r.paymentId,
      invoiceId: r.invoiceId,
      dealType: r.dealType,
      paymentType: r.paymentType,
      baseAmount: r.baseAmount.toFixed(2),
      percent: r.percent.toFixed(2),
      amount: r.amount.toFixed(2),
      status: r.status,
      eligibleAt: r.eligibleAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listPartnerPayoutBatches(partnerId: string): Promise<PartnerPayoutBatchDto[]> {
    await this.findById(partnerId);
    return listPartnerPayoutBatches(this.prisma, partnerId);
  }

  async createPartnerPayoutBatch(
    partnerId: string,
    input: CreatePartnerPayoutBatchInput,
  ): Promise<PartnerPayoutBatchDto> {
    await this.findById(partnerId);
    return createPartnerPayoutBatch(this.prisma, partnerId, input);
  }

  async approvePartnerPayoutBatch(
    partnerId: string,
    batchId: string,
    input: ApprovePartnerPayoutBatchInput,
  ): Promise<PartnerPayoutBatchDto> {
    await this.findById(partnerId);
    return approvePartnerPayoutBatch(this.prisma, partnerId, batchId, input);
  }

  async cancelPartnerPayoutBatch(
    partnerId: string,
    batchId: string,
    input: CancelPartnerPayoutBatchInput,
  ): Promise<PartnerPayoutBatchDto> {
    await this.findById(partnerId);
    return cancelPartnerPayoutBatch(this.prisma, partnerId, batchId, input);
  }

  async listPartnerServiceTerms(partnerId: string): Promise<PartnerServiceTermWireDto[]> {
    await this.findById(partnerId);
    return listPartnerServiceTerms(this.prisma, partnerId);
  }

  async createPartnerServiceTerm(
    partnerId: string,
    input: CreatePartnerServiceTermInput,
  ): Promise<PartnerServiceTermWireDto> {
    await this.findById(partnerId);
    return createPartnerServiceTerm(this.prisma, partnerId, input);
  }

  async updatePartnerServiceTerm(
    partnerId: string,
    termId: string,
    input: UpdatePartnerServiceTermInput,
  ): Promise<PartnerServiceTermWireDto> {
    await this.findById(partnerId);
    return updatePartnerServiceTerm(this.prisma, partnerId, termId, input);
  }

  async getStats() {
    const [total, totalSubscriptions, avgPayout] = await Promise.all([
      this.prisma.partner.count(),
      this.prisma.subscription.count({
        where: { partnerId: { not: null } },
      }),
      this.prisma.partner.aggregate({
        _avg: { defaultPercent: true },
      }),
    ]);

    const rawAvg = avgPayout._avg?.defaultPercent;
    const avgPayoutPercent =
      rawAvg == null ? 0 : typeof rawAvg === 'number' ? rawAvg : Number(rawAvg.toString());

    return {
      total,
      totalSubscriptions,
      avgPayoutPercent,
    };
  }
}
