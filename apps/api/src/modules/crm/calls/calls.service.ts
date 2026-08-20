import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { mapCallResponse } from './call-response.map';
import { CALLS_PAGE_SIZE_DEFAULT, CALLS_PAGE_SIZE_MAX } from './calls.constants';

const CALL_SELECT = {
  id: true,
  uid: true,
  calldirect: true,
  phone: true,
  clid: true,
  state: true,
  billsec: true,
  disposition: true,
  rate: true,
  leadId: true,
  contactId: true,
  dealId: true,
  responsibleEmployeeId: true,
  answeredEmployeeId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface ListCallsQuery {
  leadId?: string;
  contactId?: string;
  dealId?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class CallsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(query: ListCallsQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = clampPageSize(query.pageSize);
    const where = buildCallListWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.atsCallEvent.findMany({
        where,
        select: CALL_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.atsCallEvent.count({ where }),
    ]);

    return {
      items: rows.map(mapCallResponse),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id },
      select: CALL_SELECT,
    });
    if (!row) {
      throw new NotFoundException(`Call ${id} not found`);
    }
    return mapCallResponse(row);
  }
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) return CALLS_PAGE_SIZE_DEFAULT;
  return Math.min(pageSize, CALLS_PAGE_SIZE_MAX);
}

function buildCallListWhere(query: ListCallsQuery): Prisma.AtsCallEventWhereInput {
  const where: Prisma.AtsCallEventWhereInput = {};
  if (query.leadId) where.leadId = query.leadId;
  if (query.contactId) where.contactId = query.contactId;
  if (query.dealId) where.dealId = query.dealId;
  return where;
}
