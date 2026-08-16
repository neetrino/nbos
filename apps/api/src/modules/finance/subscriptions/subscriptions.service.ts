import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import {
  PrismaClient,
  type Prisma,
  type SubscriptionTypeEnum,
  type SubscriptionStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { assertSubscriptionStatus, attachSubscriptionCoverage } from './subscription-coverage';
import { buildSubscriptionGridPayload } from './subscription-grid';
import { parseSubscriptionStatusQuery } from './subscription-status-query';
import { assertSubscriptionStatusTransition } from './subscription-status-transitions';
import {
  applySubscriptionBillingPatch,
  assertTermMonthsAlignWithCoverage,
  parseOptionalTermMonths,
  resolveSubscriptionBillingInput,
} from './subscription-billing-dto';
import {
  applyReminderLanguagePatch,
  parseReminderLanguage,
} from './subscription-reminder-language';
import { mergeFinanceWhere, type FinanceScopedAccessContext } from '../finance-scoped-access';
import { resolveSubscriptionParticipationWhere } from '../finance-module-participation.where';
import {
  parseOptionalSubscriptionName,
  parseRequiredSubscriptionName,
} from './subscription-commercial-name';
import { resolveSubscriptionProductOwnership } from './subscription-product-ownership';

interface CreateSubscriptionDto {
  productId: string;
  /** Optional; must match Product.projectId when provided. */
  projectId?: string;
  /** Commercial display name (required). */
  name: string;
  type: string;
  /** Period sum (one billing cycle). */
  amount?: number;
  billingDay: number;
  billingFrequency?: string;
  coverageMonthCount?: number | null;
  taxStatus?: string;
  billingStartDate?: string;
  /** @deprecated Use billingStartDate */
  startDate?: string;
  notificationsEnabled?: boolean;
  /** HY | RU | EN — client WhatsApp payment reminder language (default HY). */
  reminderLanguage?: string;
  endDate?: string;
  /** Covered months until term ends; null = open-ended. */
  termMonths?: number | null;
  partnerId?: string;
}

interface UpdateSubscriptionDto {
  type?: string;
  /** Commercial display name; when sent must be non-empty after trim. */
  name?: string;
  /** Optional re-link; must match Product.projectId when projectId also sent. */
  productId?: string;
  projectId?: string;
  /** Period sum (one billing cycle). */
  amount?: number;
  billingDay?: number;
  billingFrequency?: string;
  coverageMonthCount?: number | null;
  taxStatus?: string;
  billingStartDate?: string;
  /** @deprecated Use billingStartDate */
  startDate?: string;
  notificationsEnabled?: boolean;
  reminderLanguage?: string;
  endDate?: string;
  /** Covered months until term ends; null = open-ended. */
  termMonths?: number | null;
  partnerId?: string | null;
}

interface SubscriptionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  partnerId?: string;
  status?: string;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  access?: FinanceScopedAccessContext;
}

interface SubscriptionStatsParams {
  dateFrom?: string;
  dateTo?: string;
  partnerId?: string;
  access?: FinanceScopedAccessContext;
}

interface SubscriptionGridParams {
  year: number;
  projectId?: string;
  partnerId?: string;
  status?: string;
  type?: string;
  search?: string;
  access?: FinanceScopedAccessContext;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async getGrid(params: SubscriptionGridParams) {
    const { year, projectId, partnerId, status, type, search } = params;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const andParts: Prisma.SubscriptionWhereInput[] = [
      ...subscriptionGridYearWindow(yearStart, yearEnd),
    ];

    if (projectId) andParts.push({ projectId });
    const statusWhere = parseSubscriptionStatusQuery(status);
    if (statusWhere) andParts.push({ status: statusWhere });
    if (type) andParts.push({ type: type as SubscriptionTypeEnum });
    if (search?.trim()) {
      const q = search.trim();
      const ic = { contains: q, mode: 'insensitive' as const };
      andParts.push({
        OR: [
          { code: ic },
          { name: ic },
          { project: { name: ic } },
          { project: { code: ic } },
          { project: { company: { name: ic } } },
          { partner: { name: ic } },
        ],
      });
    }

    const partnerClause = this.subscriptionPartnerWhere(partnerId);
    if (Object.keys(partnerClause).length > 0) {
      andParts.push(partnerClause);
    }

    const participationWhere = await resolveSubscriptionParticipationWhere(
      this.prisma,
      params.access,
    );
    const gridWhere = mergeFinanceWhere({ AND: andParts }, participationWhere);

    const subscriptions = await this.prisma.subscription.findMany({
      where: gridWhere,
      include: {
        project: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        invoices: {
          where: { type: 'SUBSCRIPTION' },
          select: {
            id: true,
            type: true,
            amount: true,
            dueDate: true,
            coverageStartMonth: true,
            coverageMonthCount: true,
            createdAt: true,
            payments: { select: { amount: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: SUBSCRIPTION_INBOX_ORDER_BY,
    });

    return buildSubscriptionGridPayload(subscriptions, year, new Date());
  }

  async findAll(params: SubscriptionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      partnerId,
      status,
      type,
      search,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.SubscriptionWhereInput = {};

    if (projectId) where.projectId = projectId;
    Object.assign(where, this.subscriptionPartnerWhere(partnerId));
    const statusWhere = parseSubscriptionStatusQuery(status);
    if (statusWhere) where.status = statusWhere;
    if (type) where.type = type as SubscriptionTypeEnum;
    if (search?.trim()) {
      const q = search.trim();
      const ic = { contains: q, mode: 'insensitive' as const };
      where.OR = [
        { code: ic },
        { name: ic },
        { project: { name: ic } },
        { project: { code: ic } },
        { project: { company: { name: ic } } },
        { partner: { name: ic } },
      ];
    }

    const createdAt = this.buildDateRange(dateFrom, dateTo);
    if (createdAt) {
      where.createdAt = createdAt;
    }

    const participationWhere = await resolveSubscriptionParticipationWhere(
      this.prisma,
      params.access,
    );
    const listWhere = mergeFinanceWhere(where, participationWhere);

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: listWhere,
        include: {
          project: { select: { id: true, code: true, name: true } },
          product: { select: { id: true, name: true } },
          partner: { select: { id: true, name: true } },
          _count: { select: { invoices: true } },
          invoices: {
            where: { type: 'SUBSCRIPTION' },
            select: {
              type: true,
              amount: true,
              coverageStartMonth: true,
              coverageMonthCount: true,
              payments: { select: { amount: true } },
            },
          },
        },
        orderBy: SUBSCRIPTION_INBOX_ORDER_BY,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.subscription.count({ where: listWhere }),
    ]);

    return {
      items: items.map((row) => attachSubscriptionCoverage(row)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        project: true,
        product: { select: { id: true, name: true, projectId: true } },
        partner: true,
        invoices: {
          include: { payments: { select: { id: true, amount: true, paymentDate: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return attachSubscriptionCoverage(subscription);
  }

  async create(data: CreateSubscriptionDto) {
    const name = parseRequiredSubscriptionName(data.name);
    const ownership = await resolveSubscriptionProductOwnership(this.prisma, {
      productId: data.productId,
      projectId: data.projectId,
    });
    const code = await this.generateCode();
    const billing = resolveSubscriptionBillingInput(data);
    const termMonths = parseOptionalTermMonths(data.termMonths);
    if (termMonths != null) {
      assertTermMonthsAlignWithCoverage(termMonths, billing.coverageMonthCount);
    }
    const created = await this.prisma.subscription.create({
      data: {
        code,
        name,
        projectId: ownership.projectId,
        productId: ownership.productId,
        type: data.type as SubscriptionTypeEnum,
        amount: billing.amount,
        billingFrequency: billing.billingFrequency,
        coverageMonthCount: billing.coverageMonthCount,
        billingDay: data.billingDay,
        taxStatus:
          (data.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set']) ?? 'TAX',
        billingStartDate: billing.billingStartDate,
        notificationsEnabled: billing.notificationsEnabled,
        reminderLanguage: parseReminderLanguage(data.reminderLanguage),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        termMonths,
        partnerId: data.partnerId,
      },
    });
    return this.findById(created.id);
  }

  async update(id: string, data: UpdateSubscriptionDto) {
    const current = await this.findById(id);

    const updateData: Prisma.SubscriptionUpdateInput = {};
    if (data.type) updateData.type = data.type as SubscriptionTypeEnum;
    const name = parseOptionalSubscriptionName(data.name);
    if (name !== undefined) updateData.name = name;
    if (data.productId !== undefined) {
      const ownership = await resolveSubscriptionProductOwnership(this.prisma, {
        productId: data.productId,
        projectId: data.projectId,
      });
      updateData.product = { connect: { id: ownership.productId } };
      updateData.project = { connect: { id: ownership.projectId } };
    }
    applySubscriptionBillingPatch(data, updateData);
    applyReminderLanguagePatch(data.reminderLanguage, updateData);
    if (data.billingDay !== undefined) updateData.billingDay = data.billingDay;
    if (data.taxStatus) {
      updateData.taxStatus =
        data.taxStatus as Prisma.EnumTaxStatusFieldUpdateOperationsInput['set'];
    }
    applyEndDatePatch(data.endDate, updateData);
    applyTermMonthsPatch(data.termMonths, updateData);
    assertUpdatedTermAlignsWithCoverage(current, data, updateData);
    if (data.partnerId !== undefined)
      updateData.partner = data.partnerId
        ? { connect: { id: data.partnerId } }
        : { disconnect: true };

    await this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    assertSubscriptionStatus(status);
    const current = await this.findById(id);
    assertSubscriptionStatusTransition(
      current.status as SubscriptionStatusEnum,
      status as SubscriptionStatusEnum,
    );

    const updateData: Prisma.SubscriptionUpdateInput = {
      status: status as SubscriptionStatusEnum,
    };
    if (status === 'ACTIVE' && !current.billingStartDate) {
      updateData.billingStartDate = new Date();
    }
    if (status === 'ACTIVE' && current.status === 'CANCELLED') {
      updateData.endDate = null;
    }
    if (status === 'CANCELLED') {
      updateData.endDate = new Date();
    }
    if (status === 'COMPLETED' && current.endDate == null) {
      updateData.endDate = new Date();
    }

    await this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });
    return this.findById(id);
  }

  async getStats(params: SubscriptionStatsParams = {}) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const snapshotDate = params.dateTo ? new Date(params.dateTo) : new Date();
    const partnerWhere = this.subscriptionPartnerWhere(params.partnerId);
    const participationWhere = await resolveSubscriptionParticipationWhere(
      this.prisma,
      params.access,
    );
    const withPartner = (base: Prisma.SubscriptionWhereInput): Prisma.SubscriptionWhereInput =>
      mergeFinanceWhere({ ...base, ...partnerWhere }, participationWhere);
    const periodWhere = withPartner(createdAt ? { createdAt } : {});
    const activeWhere = withPartner({
      status: 'ACTIVE',
      billingStartDate: { lte: snapshotDate },
      OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
    });

    const [total, byStatus, byType, totalRevenue, activeSubscriptions] = await Promise.all([
      this.prisma.subscription.count({ where: periodWhere }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        where: periodWhere,
        _count: true,
        _sum: { monthlyEquivalentAmount: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['type'],
        where: periodWhere,
        _count: true,
        _sum: { monthlyEquivalentAmount: true },
      }),
      this.prisma.subscription.aggregate({
        where: activeWhere,
        _sum: { monthlyEquivalentAmount: true },
      }),
      this.prisma.subscription.count({ where: activeWhere }),
    ]);

    return {
      total,
      byStatus,
      byType,
      activeSubscriptions,
      monthlyRevenue: totalRevenue._sum?.monthlyEquivalentAmount ?? null,
    };
  }

  private subscriptionPartnerWhere(partnerId?: string): Prisma.SubscriptionWhereInput {
    if (!partnerId) return {};
    if (partnerId === SUBSCRIPTION_PARTNER_FILTER_UNLINKED) {
      return { partnerId: null };
    }
    return { partnerId };
  }

  private buildDateRange(dateFrom?: string, dateTo?: string): Prisma.DateTimeFilter | undefined {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SUB-${year}-`;
    const last = await this.prisma.subscription.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}

const SUBSCRIPTION_INBOX_ORDER_BY = [{ status: 'asc' as const }, { createdAt: 'desc' as const }];

function subscriptionGridYearWindow(
  yearStart: Date,
  yearEnd: Date,
): Prisma.SubscriptionWhereInput[] {
  return [
    {
      OR: [{ billingStartDate: { lte: yearEnd } }, { status: 'PENDING', billingStartDate: null }],
    },
    { OR: [{ endDate: null }, { endDate: { gte: yearStart } }] },
  ];
}

/** `undefined` untouched; blank string clears to null; valid ISO sets the date. */
function applyEndDatePatch(
  endDate: string | undefined,
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  if (endDate === undefined) {
    return;
  }
  if (endDate.trim() === '') {
    updateData.endDate = null;
    return;
  }
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('endDate is invalid');
  }
  updateData.endDate = parsed;
}

/** `undefined` untouched; `null` clears; otherwise validated integer months. */
function applyTermMonthsPatch(
  termMonths: number | null | undefined,
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  const parsed = parseOptionalTermMonths(termMonths);
  if (parsed !== undefined) {
    updateData.termMonths = parsed;
  }
}

function assertUpdatedTermAlignsWithCoverage(
  current: { termMonths: number | null; coverageMonthCount: number },
  data: UpdateSubscriptionDto,
  updateData: Prisma.SubscriptionUpdateInput,
): void {
  const nextTerm =
    data.termMonths !== undefined ? parseOptionalTermMonths(data.termMonths) : current.termMonths;
  if (nextTerm == null) {
    return;
  }
  const nextCoverage =
    typeof updateData.coverageMonthCount === 'number'
      ? updateData.coverageMonthCount
      : current.coverageMonthCount;
  assertTermMonthsAlignWithCoverage(nextTerm, nextCoverage);
}
