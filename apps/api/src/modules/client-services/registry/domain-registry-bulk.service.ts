import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  mergeFinanceWhere,
  type FinanceScopedAccessContext,
} from '../../finance/finance-scoped-access';
import { resolveClientServiceParticipationWhere } from '../client-service-access.op';
import {
  BULK_CHECK_PAGE_SIZE,
  BULK_CHECK_RESPONSE_DEADLINE_MS,
  BULK_CHECK_TIME_BUDGET_MS,
  BULK_LOOKUP_TIMEOUT_MS,
} from './domain-registry.constants';
import {
  DOMAIN_REGISTRY_ROW_INCLUDE,
  resolveRowDomainName,
  type DomainRegistryServiceRow,
} from './domain-registry.row';
import { DomainRegistryService } from './domain-registry.service';
import {
  summarizeDomainRegistryBulkPage,
  type DomainRegistryBulkOutcome,
  type DomainRegistryBulkPageResult,
} from './domain-registry-bulk.summary';
import { delay, runRegistryLanes } from './registry-lanes';

export interface DomainRegistryBulkPageInput {
  cursor: string | null;
  actor: ActorContext;
  access?: FinanceScopedAccessContext;
  now?: () => number;
  /** Test seam. Production uses {@link BULK_CHECK_RESPONSE_DEADLINE_MS}. */
  responseDeadlineMs?: number;
}

type LaneItem = { row: DomainRegistryServiceRow; domainName: string };

/**
 * Manual "check all domains": one time-boxed page per request, cursor-paged by id, so no
 * request outlives the browser timeout and no run state is stored server-side. Same apply rules
 * as the daily cron (force refresh, including an earlier registry day). No invoice side effects:
 * only the per-card Check creates a renewal invoice after a correction.
 */
@Injectable()
export class DomainRegistryBulkService {
  private readonly logger = new Logger(DomainRegistryBulkService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly registry: DomainRegistryService,
  ) {}

  async checkPage(input: DomainRegistryBulkPageInput): Promise<DomainRegistryBulkPageResult> {
    const now = input.now ?? Date.now;
    const deadlineAt = now() + BULK_CHECK_TIME_BUDGET_MS;
    const responseDeadlineMs = input.responseDeadlineMs ?? BULK_CHECK_RESPONSE_DEADLINE_MS;
    const scope = await this.scopeWhere(input.access);
    const [total, rows] = await Promise.all([
      this.prisma.clientServiceRecord.count({ where: scope }),
      this.prisma.clientServiceRecord.findMany({
        where: input.cursor ? { AND: [scope, { id: { gt: input.cursor } }] } : scope,
        include: DOMAIN_REGISTRY_ROW_INCLUDE,
        orderBy: { id: 'asc' },
        take: BULK_CHECK_PAGE_SIZE + 1,
      }),
    ]);
    const page = rows.slice(0, BULK_CHECK_PAGE_SIZE);
    const outcomes = await this.checkRows(page, input.actor, deadlineAt, now, responseDeadlineMs);
    return summarizeDomainRegistryBulkPage({
      page,
      outcomes,
      total,
      cursor: input.cursor,
      pageHasMore: rows.length > BULK_CHECK_PAGE_SIZE,
    });
  }

  private async scopeWhere(
    access: FinanceScopedAccessContext | undefined,
  ): Promise<Prisma.ClientServiceRecordWhereInput> {
    const participation = await resolveClientServiceParticipationWhere(this.prisma, access);
    return mergeFinanceWhere<Prisma.ClientServiceRecordWhereInput>(
      { type: 'DOMAIN', status: { not: 'CANCELLED' } },
      participation,
    );
  }

  private async checkRows(
    rows: readonly DomainRegistryServiceRow[],
    actor: ActorContext,
    deadlineAt: number,
    now: () => number,
    responseDeadlineMs: number,
  ): Promise<Map<string, DomainRegistryBulkOutcome>> {
    const outcomes = new Map<string, DomainRegistryBulkOutcome>();
    const items: LaneItem[] = [];
    for (const row of rows) {
      const domainName = resolveRowDomainName(row);
      if (domainName) items.push({ row, domainName });
      else outcomes.set(row.id, 'skipped');
    }
    const lanes = runRegistryLanes(
      items,
      async (item) => {
        outcomes.set(item.row.id, await this.checkOne(item.row, actor));
      },
      { deadlineAt, now },
    );
    await Promise.race([lanes, delay(responseDeadlineMs)]);
    return new Map(outcomes);
  }

  private async checkOne(
    row: DomainRegistryServiceRow,
    actor: ActorContext,
  ): Promise<DomainRegistryBulkOutcome> {
    try {
      const result = await this.registry.checkRow(row, actor, {
        force: true,
        timeoutMs: BULK_LOOKUP_TIMEOUT_MS,
      });
      return result.outcome;
    } catch (caught: unknown) {
      this.logger.warn({
        event: 'domain_registry_bulk_check_failed',
        serviceId: row.id,
        message: caught instanceof Error ? caught.message : 'Lookup failed',
      });
      return 'failed';
    }
  }
}
