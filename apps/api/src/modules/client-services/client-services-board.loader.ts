import type { Prisma, PrismaClient } from '@nbos/database';
import {
  buildClientServiceListInclude,
  normalizeClientServicePageSize,
  serializeClientServiceListRow,
} from './client-services.helpers';
import { buildClientServiceStageWhere } from './client-service-payment-stage';
import type { ClientServiceRecordQueryParams } from './client-services.types';
import {
  CLIENT_SERVICE_BOARD_DEFAULT_PAGE_SIZE,
  CLIENT_SERVICE_BOARD_STATUS_ORDER,
  type ClientServiceBoardColumnPayload,
  type ClientServiceBoardPayload,
  type ClientServiceBoardQueryParams,
} from './client-services-board.types';

type BoardColumnSpec = {
  key: string;
  columnWhere: Prisma.ClientServiceRecordWhereInput;
};

export async function loadClientServiceBoard(
  prisma: InstanceType<typeof PrismaClient>,
  params: ClientServiceBoardQueryParams,
  buildScopeWhere: (
    scope: ClientServiceRecordQueryParams,
    now: Date,
  ) => Prisma.ClientServiceRecordWhereInput,
): Promise<ClientServiceBoardPayload> {
  const now = new Date();
  const pageSize = normalizeClientServicePageSize(
    params.pageSize ?? CLIENT_SERVICE_BOARD_DEFAULT_PAGE_SIZE,
  );
  const year = resolveBoardYear(params.year);
  const scopeWhere = buildScopeWhere(params, now);
  const specs = buildColumnSpecs(params.view, year, scopeWhere, now);

  const columns = await Promise.all(
    specs.map((spec) => loadBoardColumn(prisma, spec, pageSize, now)),
  );

  return { view: params.view, year, columns };
}

function resolveBoardYear(year: number | undefined): number {
  if (Number.isInteger(year) && year && year >= 2000 && year <= 2100) return year;
  return new Date().getUTCFullYear();
}

function buildColumnSpecs(
  view: ClientServiceBoardQueryParams['view'],
  year: number,
  scopeWhere: Prisma.ClientServiceRecordWhereInput,
  now: Date,
): BoardColumnSpec[] {
  if (view === 'status') {
    return CLIENT_SERVICE_BOARD_STATUS_ORDER.map((stage) => ({
      key: stage,
      columnWhere: { AND: [scopeWhere, buildClientServiceStageWhere(stage, now)] },
    }));
  }

  return Array.from({ length: 12 }, (_, month) => {
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));
    return {
      key: `${year}-${month}`,
      columnWhere: { AND: [scopeWhere, { renewalDate: { gte: start, lt: end } }] },
    };
  });
}

async function loadBoardColumn(
  prisma: InstanceType<typeof PrismaClient>,
  spec: BoardColumnSpec,
  pageSize: number,
  now: Date,
): Promise<ClientServiceBoardColumnPayload> {
  const where = spec.columnWhere;
  const [items, aggregate] = await Promise.all([
    prisma.clientServiceRecord.findMany({
      where,
      include: buildClientServiceListInclude(),
      orderBy: { renewalDate: 'asc' },
      skip: 0,
      take: pageSize,
    }),
    prisma.clientServiceRecord.aggregate({
      where,
      _count: { _all: true },
      _sum: { ourCost: true },
    }),
  ]);

  const total = aggregate._count._all;

  return {
    key: spec.key,
    count: total,
    sum: String(aggregate._sum.ourCost ?? 0),
    items: items.map((row) => serializeClientServiceListRow(row, now)),
    meta: {
      total,
      page: 1,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  };
}
