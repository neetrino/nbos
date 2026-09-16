import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { mergeFinanceWhere } from '../finance/finance-scoped-access';
import { fillCredentialContextIfEmpty } from '../expenses/expense-credential-link';
import {
  assertClientServiceAccessible,
  resolveClientServiceParticipationWhere,
} from './client-service-access.op';
import {
  CLIENT_SERVICE_PAYMENT_STAGES,
  buildClientServiceOverdueWhere,
  buildClientServiceStageWhere,
} from './client-service-payment-stage';
import { CLIENT_SERVICE_NESTED_NONE } from './client-service-nested-visibility';
import {
  assertClientServiceActiveForMutation,
  assertClientServiceExists,
  buildClientServiceCreateData,
  buildClientServiceUpdateData,
} from './client-service-record.mutate';
import {
  buildClientServiceOrderBy,
  buildClientServiceWhere,
  resolveClientServiceStatsYear,
} from './client-service-record.where';
import {
  buildClientServiceDetailInclude,
  buildClientServiceListInclude,
  CLIENT_SERVICE_RENEWAL_WINDOW_DAYS,
  fetchLinkedTasksForClientService,
  normalizeClientServicePage,
  normalizeClientServicePageSize,
  serializeClientServiceDetail,
  serializeClientServiceListRow,
  type ClientServiceDetailRow,
} from './client-services.helpers';
import { loadClientServiceBoard } from './client-services-board.loader';
import type { ClientServiceBoardQueryParams } from './client-services-board.types';
import type {
  ClientServiceRecordBody,
  ClientServiceRecordQueryParams,
  ClientServiceWriteOptions,
  UpdateClientServiceRecordBody,
} from './client-services.types';

@Injectable()
export class ClientServicesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ClientServiceRecordQueryParams) {
    const page = normalizeClientServicePage(params.page);
    const pageSize = normalizeClientServicePageSize(params.pageSize);
    const now = new Date();
    const where = await this.scopedWhere(params, now);
    const orderBy = buildClientServiceOrderBy(params.sortBy, params.sortOrder);

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
    const participation = await resolveClientServiceParticipationWhere(this.prisma, params.access);
    return loadClientServiceBoard(this.prisma, params, (scope, now) =>
      mergeFinanceWhere(buildClientServiceWhere(scope, now), participation),
    );
  }

  async getStats(params: ClientServiceRecordQueryParams) {
    const now = new Date();
    const where = await this.scopedWhere(params, now);
    const renewalTo = new Date(now);
    renewalTo.setUTCDate(renewalTo.getUTCDate() + CLIENT_SERVICE_RENEWAL_WINDOW_DAYS);
    const year = resolveClientServiceStatsYear(params.year);

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

  async findById(id: string, options: ClientServiceWriteOptions = {}) {
    await assertClientServiceAccessible(this.prisma, id, options.access);
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id },
      include: buildClientServiceDetailInclude(),
    });
    if (!row) throw new NotFoundException('Client service record not found');
    return this.toDetailResponse(row, options.nested);
  }

  async create(body: ClientServiceRecordBody, options: ClientServiceWriteOptions = {}) {
    const data = await buildClientServiceCreateData(this.prisma, body);
    const row = await this.prisma.clientServiceRecord.create({
      data,
      include: buildClientServiceDetailInclude(),
    });
    await this.syncLinkedCredentialContext(row);
    return this.toDetailResponse(row, options.nested);
  }

  async update(
    id: string,
    body: UpdateClientServiceRecordBody,
    options: ClientServiceWriteOptions = {},
  ) {
    await assertClientServiceAccessible(this.prisma, id, options.access);
    await assertClientServiceActiveForMutation(this.prisma, id);
    const data = await buildClientServiceUpdateData(this.prisma, body);
    const row = await this.prisma.clientServiceRecord.update({
      where: { id },
      data,
      include: buildClientServiceDetailInclude(),
    });
    await this.syncLinkedCredentialContext(row);
    return this.toDetailResponse(row, options.nested);
  }

  async cancel(id: string, options: ClientServiceWriteOptions = {}) {
    await assertClientServiceAccessible(this.prisma, id, options.access);
    await assertClientServiceActiveForMutation(this.prisma, id);
    const row = await this.prisma.clientServiceRecord.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: buildClientServiceDetailInclude(),
    });
    return this.toDetailResponse(row, options.nested);
  }

  /** @deprecated Hard delete removed — cancel the service (Profile A-lite). */
  async delete(id: string, options: ClientServiceWriteOptions = {}): Promise<never> {
    await assertClientServiceAccessible(this.prisma, id, options.access);
    await assertClientServiceExists(this.prisma, id);
    throw new ConflictException(
      'Client service records cannot be deleted. Cancel the service (POST /client-services/:id/cancel) instead.',
    );
  }

  async assertAccessible(id: string, options: ClientServiceWriteOptions = {}): Promise<void> {
    await assertClientServiceAccessible(this.prisma, id, options.access);
  }

  private async scopedWhere(
    params: ClientServiceRecordQueryParams,
    now: Date,
  ): Promise<Prisma.ClientServiceRecordWhereInput> {
    const participation = await resolveClientServiceParticipationWhere(this.prisma, params.access);
    return mergeFinanceWhere(buildClientServiceWhere(params, now), participation);
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

  private async syncLinkedCredentialContext(row: {
    id: string;
    productId: string | null;
    providerAccountId: string | null;
  }): Promise<void> {
    await fillCredentialContextIfEmpty(this.prisma, row.providerAccountId, {
      productId: row.productId,
      clientServiceRecordId: row.id,
    });
  }

  private async toDetailResponse(row: ClientServiceDetailRow, nested = CLIENT_SERVICE_NESTED_NONE) {
    const tasks = await fetchLinkedTasksForClientService(this.prisma, row.id);
    return serializeClientServiceDetail(row, tasks, nested);
  }
}
