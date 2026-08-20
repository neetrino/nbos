import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { CALL_LIST_SELECT } from './call-list.select';
import { mapCallResponse } from './call-response.map';
import { assertCanListCalls, assertCanViewCall, resolveCallListParent } from './calls-access';
import { CALLS_PAGE_SIZE_DEFAULT, CALLS_PAGE_SIZE_MAX } from './calls.constants';

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

  async findAll(query: ListCallsQuery, permissions: Record<string, string>) {
    const parent = resolveCallListParent(query);
    assertCanListCalls(permissions, parent);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = clampPageSize(query.pageSize);
    const where = buildCallListWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.atsCallEvent.findMany({
        where,
        select: CALL_LIST_SELECT,
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

  async findById(id: string, permissions: Record<string, string>) {
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id },
      select: CALL_LIST_SELECT,
    });
    if (!row) {
      throw new NotFoundException(`Call ${id} not found`);
    }
    assertCanViewCall(permissions, row);
    return mapCallResponse(row);
  }
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) return CALLS_PAGE_SIZE_DEFAULT;
  return Math.min(pageSize, CALLS_PAGE_SIZE_MAX);
}

function buildCallListWhere(query: ListCallsQuery): Prisma.AtsCallEventWhereInput {
  if (query.leadId) return { leadId: query.leadId };
  if (query.contactId) return { contactId: query.contactId };
  return { dealId: query.dealId };
}
