import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { CALL_LIST_SELECT } from './call-list.select';
import { mapCallResponse } from './call-response.map';
import { CallAccessPolicyService } from './call-access-policy.service';
import type { CallAccessActor } from './call-access.types';
import { buildCallParentWhere, mergeCallListWhere } from './call-access.where';
import { assertCanListCalls, resolveCallListParent } from './calls-access';
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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly access: CallAccessPolicyService,
  ) {}

  async findAll(query: ListCallsQuery, actor: CallAccessActor) {
    const parent = resolveCallListParent(query);
    assertCanListCalls(actor.permissions, parent);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = clampPageSize(query.pageSize);
    const where = mergeCallListWhere(
      buildCallParentWhere(parent, query),
      await this.access.resolveAccessWhere(actor),
    );

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

  async findById(id: string, actor: CallAccessActor) {
    await this.access.assertCanAccessCall(actor, id);
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id },
      select: CALL_LIST_SELECT,
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
