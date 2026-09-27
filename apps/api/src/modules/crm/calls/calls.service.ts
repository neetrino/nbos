import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  groupCallConversations,
  mergeCallConversation,
  normalizeCallLid,
  pageConversationGroups,
  type CallConversationRow,
} from './call-conversation';
import { CALL_CONVERSATION_KEY_SELECT, CALL_LIST_SELECT } from './call-list.select';
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

  async findJournal(query: ListCallsQuery, actor: CallAccessActor) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = clampPageSize(query.pageSize);
    const where = await this.access.resolveJournalAccessWhere(actor);

    return this.listConversations(where, page, pageSize);
  }

  async findAll(query: ListCallsQuery, actor: CallAccessActor) {
    const parent = resolveCallListParent(query);
    assertCanListCalls(actor.permissions, parent);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = clampPageSize(query.pageSize);
    const where = mergeCallListWhere(
      buildCallParentWhere(parent, query),
      await this.access.resolveAccessWhere(actor),
    );

    return this.listConversations(where, page, pageSize);
  }

  async findById(id: string, actor: CallAccessActor) {
    const accessWhere = await this.access.assertCanAccessCall(actor, id);
    const row = await this.loadCallRow(id);
    if (!row) throw new NotFoundException(`Call ${id} not found`);
    const members = await this.loadVisibleMembers(row, accessWhere);
    return mapCallResponse(mergeCallConversation(members));
  }

  /**
   * Every visible key is loaded before the page slice.
   * Truncating that scan would publish a later connection as the card id.
   * `meta.total` counts conversations. Only the current page is hydrated.
   */
  private async listConversations(
    where: Prisma.AtsCallEventWhereInput,
    page: number,
    pageSize: number,
  ) {
    const keys = await this.prisma.atsCallEvent.findMany({
      where,
      select: CALL_CONVERSATION_KEY_SELECT,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const paged = pageConversationGroups(groupCallConversations(keys), page, pageSize);
    const items = await this.hydrateConversations(where, paged.groups);
    return {
      items,
      meta: { total: paged.total, page, pageSize, totalPages: paged.totalPages },
    };
  }

  private async hydrateConversations(
    where: Prisma.AtsCallEventWhereInput,
    groups: Array<Array<{ id: string }>>,
  ) {
    const memberIds = groups.flatMap((group) => group.map((row) => row.id));
    if (memberIds.length === 0) return [];
    const rows = await this.prisma.atsCallEvent.findMany({
      where: { AND: [where, { id: { in: memberIds } }] },
      select: CALL_LIST_SELECT,
    });
    const byId = new Map(rows.map((row) => [row.id, row as CallConversationRow]));
    return groups.flatMap((group) => {
      const members = group.flatMap((key) => {
        const row = byId.get(key.id);
        return row ? [row] : [];
      });
      const card = members[0] ? mergeCallConversation(members) : null;
      return card ? [mapCallResponse(card)] : [];
    });
  }

  private async loadVisibleMembers(
    row: CallConversationRow,
    accessWhere: Prisma.AtsCallEventWhereInput,
  ): Promise<CallConversationRow[]> {
    const lid = normalizeCallLid(row.lid);
    if (!lid) return [row];
    const members = await this.prisma.atsCallEvent.findMany({
      where: { AND: [accessWhere, { lid }] },
      select: CALL_LIST_SELECT,
    });
    const visible = members as CallConversationRow[];
    return visible.length > 0 ? visible : [row];
  }

  private async loadCallRow(id: string): Promise<CallConversationRow | null> {
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id },
      select: CALL_LIST_SELECT,
    });
    return row as CallConversationRow | null;
  }
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) return CALLS_PAGE_SIZE_DEFAULT;
  return Math.min(pageSize, CALLS_PAGE_SIZE_MAX);
}
