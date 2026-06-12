import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClient,
  type ClientServiceBillingModel,
  type ClientServiceStatus,
  type ClientServiceType,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  requireClientServiceType,
  resolveClientServiceBillingModel,
  resolveClientServiceFrequency,
  resolveClientServicePricingModel,
  resolveClientServiceStatus,
  resolveClientServiceTaxStatus,
} from './client-service-record-enum-validators';
import {
  buildClientServiceDetailInclude,
  buildClientServiceListInclude,
  CLIENT_SERVICE_RENEWAL_WINDOW_DAYS,
  CLIENT_SERVICE_SORT_FIELDS,
  fetchLinkedTasksForClientService,
  normalizeClientServicePage,
  normalizeClientServicePageSize,
  parseOptionalDate,
  serializeClientServiceDetail,
  serializeClientServiceListRow,
  toOptionalMoneyDecimal,
  type ClientServiceDetailRow,
} from './client-services.helpers';
import {
  buildClientServiceOverdueWhere,
  buildClientServiceStageWhere,
  CLIENT_SERVICE_PAYMENT_STAGES,
  isClientServicePaymentStage,
} from './client-service-payment-stage';
import { loadClientServiceBoard } from './client-services-board.loader';
import type { ClientServiceBoardQueryParams } from './client-services-board.types';
import type {
  ClientServiceRecordBody,
  ClientServiceRecordQueryParams,
  UpdateClientServiceRecordBody,
} from './client-services.types';

@Injectable()
export class ClientServicesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ClientServiceRecordQueryParams) {
    const page = normalizeClientServicePage(params.page);
    const pageSize = normalizeClientServicePageSize(params.pageSize);
    const now = new Date();
    const where = this.buildWhere(params, now);
    const orderBy = this.buildOrderBy(params.sortBy, params.sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.clientServiceRecord.findMany({
        where,
        include: buildClientServiceListInclude(),
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.clientServiceRecord.count({ where }),
    ]);

    return {
      items: items.map((row) => serializeClientServiceListRow(row, now)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getBoard(params: ClientServiceBoardQueryParams) {
    if (params.view !== 'status' && params.view !== 'months') {
      throw new BadRequestException('view must be status or months');
    }
    return loadClientServiceBoard(this.prisma, params, (scope, now) => this.buildWhere(scope, now));
  }

  async getStats(params: ClientServiceRecordQueryParams) {
    const now = new Date();
    const where = this.buildWhere(params, now);
    const renewalTo = new Date(now);
    renewalTo.setUTCDate(renewalTo.getUTCDate() + CLIENT_SERVICE_RENEWAL_WINDOW_DAYS);
    const year = this.resolveStatsYear(params.year);

    const [total, byStatus, byType, byBillingModel, dueSoon, byStage, overdue, byMonth] =
      await Promise.all([
        this.prisma.clientServiceRecord.count({ where }),
        this.prisma.clientServiceRecord.groupBy({ by: ['status'], where, _count: { _all: true } }),
        this.prisma.clientServiceRecord.groupBy({ by: ['type'], where, _count: { _all: true } }),
        this.prisma.clientServiceRecord.groupBy({
          by: ['billingModel'],
          where,
          _count: { _all: true },
        }),
        this.prisma.clientServiceRecord.count({
          where: { AND: [where, { renewalDate: { gte: now, lte: renewalTo } }] },
        }),
        this.buildStageStats(where, now),
        this.prisma.clientServiceRecord.count({
          where: { AND: [where, buildClientServiceOverdueWhere(now)] },
        }),
        this.buildMonthStats(where, year),
      ]);

    return { total, dueSoon, byStatus, byType, byBillingModel, byStage, overdue, year, byMonth };
  }

  private resolveStatsYear(year: number | undefined): number {
    if (Number.isInteger(year) && year && year >= 2000 && year <= 2100) return year;
    return new Date().getUTCFullYear();
  }

  private async buildStageStats(where: Prisma.ClientServiceRecordWhereInput, now: Date) {
    return Promise.all(
      CLIENT_SERVICE_PAYMENT_STAGES.map(async (stage) => {
        const result = await this.prisma.clientServiceRecord.aggregate({
          where: { AND: [where, buildClientServiceStageWhere(stage, now)] },
          _count: { _all: true },
          _sum: { ourCost: true },
        });
        return { stage, count: result._count._all, sum: String(result._sum.ourCost ?? 0) };
      }),
    );
  }

  private async buildMonthStats(where: Prisma.ClientServiceRecordWhereInput, year: number) {
    return Promise.all(
      Array.from({ length: 12 }, (_, month) => month).map(async (month) => {
        const start = new Date(Date.UTC(year, month, 1));
        const end = new Date(Date.UTC(year, month + 1, 1));
        const result = await this.prisma.clientServiceRecord.aggregate({
          where: { AND: [where, { renewalDate: { gte: start, lt: end } }] },
          _count: { _all: true },
          _sum: { ourCost: true },
        });
        return { month, count: result._count._all, sum: String(result._sum.ourCost ?? 0) };
      }),
    );
  }

  async findById(id: string) {
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id },
      include: buildClientServiceDetailInclude(),
    });
    if (!row) throw new NotFoundException('Client service record not found');
    return this.toDetailResponse(row);
  }

  async create(body: ClientServiceRecordBody) {
    const data = await this.buildCreateData(body);
    const row = await this.prisma.clientServiceRecord.create({
      data,
      include: buildClientServiceDetailInclude(),
    });
    return this.toDetailResponse(row);
  }

  async update(id: string, body: UpdateClientServiceRecordBody) {
    await this.assertServiceIsActiveForMutation(id);
    const data = await this.buildUpdateData(body);
    const row = await this.prisma.clientServiceRecord.update({
      where: { id },
      data,
      include: buildClientServiceDetailInclude(),
    });
    return this.toDetailResponse(row);
  }

  private async toDetailResponse(row: ClientServiceDetailRow) {
    const tasks = await fetchLinkedTasksForClientService(this.prisma, row.id);
    return serializeClientServiceDetail(row, tasks);
  }

  async cancel(id: string) {
    await this.assertServiceIsActiveForMutation(id);
    const row = await this.prisma.clientServiceRecord.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: buildClientServiceDetailInclude(),
    });
    return this.toDetailResponse(row);
  }

  /** @deprecated Hard delete removed — cancel the service (Profile A-lite). */
  async delete(id: string): Promise<never> {
    await this.ensureExists(id);
    throw new ConflictException(
      'Client service records cannot be deleted. Cancel the service (POST /client-services/:id/cancel) instead.',
    );
  }

  private buildWhere(
    params: ClientServiceRecordQueryParams,
    now: Date,
  ): Prisma.ClientServiceRecordWhereInput {
    const base: Prisma.ClientServiceRecordWhereInput = {
      ...(params.projectId?.trim() ? { projectId: params.projectId.trim() } : {}),
      ...(params.productId?.trim() ? { productId: params.productId.trim() } : {}),
      ...(params.type?.trim()
        ? { type: requireClientServiceType(params.type) as ClientServiceType }
        : {}),
      ...this.buildStatusWhere(params.status),
      ...(params.billingModel?.trim()
        ? {
            billingModel: resolveClientServiceBillingModel(
              params.billingModel,
            ) as ClientServiceBillingModel,
          }
        : {}),
      ...this.buildSearchWhere(params.search),
      ...this.buildRenewalWhere(params.renewalFrom, params.renewalTo),
    };

    const stage = params.stage?.trim();
    if (!stage) return base;
    if (!isClientServicePaymentStage(stage)) {
      throw new BadRequestException('stage is invalid');
    }
    return { AND: [base, buildClientServiceStageWhere(stage, now)] };
  }

  private buildSearchWhere(search: string | undefined): Prisma.ClientServiceRecordWhereInput {
    const q = search?.trim();
    if (!q) return {};
    return {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { provider: { contains: q, mode: 'insensitive' } },
      ],
    };
  }

  private buildRenewalWhere(
    from: string | undefined,
    to: string | undefined,
  ): Prisma.ClientServiceRecordWhereInput {
    const gte = from?.trim() ? new Date(from) : undefined;
    const lte = to?.trim() ? new Date(to) : undefined;
    if (gte && Number.isNaN(gte.getTime())) {
      throw new BadRequestException('renewalFrom is invalid');
    }
    if (lte && Number.isNaN(lte.getTime())) {
      throw new BadRequestException('renewalTo is invalid');
    }
    return gte || lte ? { renewalDate: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {};
  }

  private buildOrderBy(
    sortBy: string | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ): Prisma.ClientServiceRecordOrderByWithRelationInput {
    const field = sortBy && CLIENT_SERVICE_SORT_FIELDS.has(sortBy) ? sortBy : 'renewalDate';
    return { [field]: sortOrder === 'desc' ? 'desc' : 'asc' };
  }

  private async buildCreateData(
    body: ClientServiceRecordBody,
  ): Promise<Prisma.ClientServiceRecordCreateInput> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('Name is required');
    const project = await this.resolveProjectOrThrow(body.projectId);
    await this.ensureProductMatchesProject(body.productId, project.id);
    await this.ensureCredentialExists(body.providerAccountId);

    return {
      project: { connect: { id: project.id } },
      ...(body.productId?.trim() ? { product: { connect: { id: body.productId.trim() } } } : {}),
      ...(body.providerAccountId?.trim()
        ? { providerAccount: { connect: { id: body.providerAccountId.trim() } } }
        : {}),
      name,
      type: requireClientServiceType(body.type),
      provider: body.provider?.trim() || null,
      status: resolveClientServiceStatus(body.status),
      billingModel: resolveClientServiceBillingModel(body.billingModel),
      pricingModel: resolveClientServicePricingModel(body.pricingModel),
      frequency: resolveClientServiceFrequency(body.frequency),
      ourCost: toOptionalMoneyDecimal(body.ourCost, 'ourCost') ?? null,
      clientCharge: toOptionalMoneyDecimal(body.clientCharge, 'clientCharge') ?? null,
      taxStatus: resolveClientServiceTaxStatus(body.taxStatus),
      notificationsEnabled: body.notificationsEnabled ?? true,
      startDate: parseOptionalDate(body.startDate, 'startDate'),
      renewalDate: parseOptionalDate(body.renewalDate, 'renewalDate'),
      notes: body.notes?.trim() || null,
    };
  }

  private async buildUpdateData(
    body: UpdateClientServiceRecordBody,
  ): Promise<Prisma.ClientServiceRecordUpdateInput> {
    const data: Prisma.ClientServiceRecordUpdateInput = {};
    if (body.projectId !== undefined) {
      data.project = { connect: { id: (await this.resolveProjectOrThrow(body.projectId)).id } };
    }
    if (body.productId !== undefined) {
      data.product = body.productId?.trim()
        ? { connect: { id: body.productId.trim() } }
        : { disconnect: true };
    }
    if (body.providerAccountId !== undefined) {
      data.providerAccount = body.providerAccountId?.trim()
        ? { connect: { id: body.providerAccountId.trim() } }
        : { disconnect: true };
    }
    if (body.name !== undefined) data.name = this.requireNonEmptyName(body.name);
    if (body.type !== undefined) data.type = requireClientServiceType(body.type);
    if (body.provider !== undefined) data.provider = body.provider?.trim() || null;
    if (body.status !== undefined) data.status = resolveClientServiceStatus(body.status);
    if (body.billingModel !== undefined) {
      data.billingModel = resolveClientServiceBillingModel(body.billingModel);
    }
    if (body.pricingModel !== undefined) {
      data.pricingModel = resolveClientServicePricingModel(body.pricingModel);
    }
    if (body.frequency !== undefined)
      data.frequency = resolveClientServiceFrequency(body.frequency);
    if (body.ourCost !== undefined) data.ourCost = toOptionalMoneyDecimal(body.ourCost, 'ourCost');
    if (body.clientCharge !== undefined) {
      data.clientCharge = toOptionalMoneyDecimal(body.clientCharge, 'clientCharge');
    }
    if (body.taxStatus !== undefined) {
      data.taxStatus = resolveClientServiceTaxStatus(body.taxStatus);
    }
    if (body.notificationsEnabled !== undefined) {
      data.notificationsEnabled = body.notificationsEnabled;
    }
    if (body.startDate !== undefined) {
      data.startDate = parseOptionalDate(body.startDate, 'startDate');
    }
    if (body.renewalDate !== undefined) {
      data.renewalDate = parseOptionalDate(body.renewalDate, 'renewalDate');
    }
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    return data;
  }

  private requireNonEmptyName(name: string): string {
    const value = name.trim();
    if (!value) throw new BadRequestException('Name cannot be empty');
    return value;
  }

  private buildStatusWhere(status: string | undefined): Prisma.ClientServiceRecordWhereInput {
    const raw = status?.trim();
    if (raw) {
      return { status: resolveClientServiceStatus(raw) as ClientServiceStatus };
    }
    return { status: { not: 'CANCELLED' } };
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.clientServiceRecord.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Client service record not found');
  }

  private async assertServiceIsActiveForMutation(id: string) {
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!row) throw new NotFoundException('Client service record not found');
    if (row.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled client service records cannot be modified');
    }
  }

  private async resolveProjectOrThrow(projectId: string | null | undefined) {
    const id = projectId?.trim();
    if (!id) throw new BadRequestException('Project is required');
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) throw new BadRequestException('Project was not found');
    return project;
  }

  private async ensureProductMatchesProject(
    productId: string | null | undefined,
    projectId: string,
  ) {
    const id = productId?.trim();
    if (!id) return;
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!product || product.projectId !== projectId) {
      throw new BadRequestException('Product does not belong to the selected project');
    }
  }

  private async ensureCredentialExists(credentialId: string | null | undefined) {
    const id = credentialId?.trim();
    if (!id) return;
    const credential = await this.prisma.credential.findFirst({
      where: { id, archivedAt: null },
      select: { id: true },
    });
    if (!credential) throw new BadRequestException('Provider account credential was not found');
  }
}
