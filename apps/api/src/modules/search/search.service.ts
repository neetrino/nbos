import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { PRISMA_TOKEN } from '../../database.module';
import { credentialsAccessFromUser } from '../credentials/credentials-access';
import type { CredentialsRuntime } from '../credentials/credentials-runtime';
import { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';
import { CredentialVaultSessionService } from '../credentials/credential-vault-session.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { isSearchQueryLongEnough, normalizeSearchQuery } from './dto/search-query.dto';
import { runWithTimeout, SearcherTimeoutError } from './run-with-timeout';
import {
  SEARCH_LIMIT_ALL_GROUP,
  SEARCH_LIMIT_FOCUSED_GROUP,
  SEARCHER_TIMEOUT_MS,
} from './search.constants';
import { isSearchGroupAllowedForUser, resolveAllowedSearchGroups } from './search-permissions';
import type {
  GlobalSearchResponse,
  SearchGroupId,
  SearchHit,
  SearchQueryGroup,
} from './search.types';
import { searchCredentials } from './searchers/credentials.searcher';
import { searchDeals } from './searchers/deals.searcher';
import { searchFinance } from './searchers/finance.searcher';
import { searchLeads } from './searchers/leads.searcher';
import { searchProducts } from './searchers/products.searcher';

type GroupRunner = () => Promise<SearchHit[]>;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly credentialsRuntime: CredentialsRuntime;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
    auditService: AuditService,
    notifications: NotificationService,
    platformAccessResolver: PlatformAccessResolverService,
    vaultSession: CredentialVaultSessionService,
  ) {
    const key = configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    this.credentialsRuntime = {
      prisma,
      encryptionKey: key,
      auditService,
      notifications,
      platformAccessResolver,
      vaultSession,
    };
  }

  async search(user: CurrentUserPayload, rawQuery?: string, group: SearchQueryGroup = 'all') {
    const query = normalizeSearchQuery(rawQuery);
    const groups = resolveAllowedSearchGroups(user.permissions);

    const response: GlobalSearchResponse = {
      query,
      groups,
      items: [],
    };

    if (!isSearchQueryLongEnough(query)) {
      return response;
    }

    if (group !== 'all' && !isSearchGroupAllowedForUser(group, user.permissions)) {
      throw new BadRequestException(`Search group not available: ${group}`);
    }

    const focused = group !== 'all';
    const perGroupLimit = focused ? SEARCH_LIMIT_FOCUSED_GROUP : SEARCH_LIMIT_ALL_GROUP;
    const runners = this.buildGroupRunners(user, query, group, perGroupLimit);

    const settled = await Promise.allSettled(
      Object.entries(runners).map(async ([groupId, runner]) => {
        const hits = await runWithTimeout(runner(), SEARCHER_TIMEOUT_MS);
        return { groupId: groupId as SearchGroupId, hits };
      }),
    );

    const items: SearchHit[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        items.push(...result.value.hits);
        continue;
      }
      const reason = result.reason;
      if (reason instanceof SearcherTimeoutError) {
        this.logger.warn('Global search group timed out');
        continue;
      }
      this.logger.error(
        'Global search group failed',
        reason instanceof Error ? reason.stack : reason,
      );
    }

    response.items = focused
      ? this.sortHits(items).slice(0, SEARCH_LIMIT_FOCUSED_GROUP)
      : this.sortHits(items);

    return response;
  }

  private buildGroupRunners(
    user: CurrentUserPayload,
    query: string,
    group: SearchQueryGroup,
    limit: number,
  ): Partial<Record<SearchGroupId, GroupRunner>> {
    const runners: Partial<Record<SearchGroupId, GroupRunner>> = {};

    const maybeAdd = (id: SearchGroupId, runner: GroupRunner) => {
      if (!isSearchGroupAllowedForUser(id, user.permissions)) return;
      if (group !== 'all' && group !== id) return;
      runners[id] = runner;
    };

    maybeAdd('leads', () => searchLeads(this.prisma, query, limit));
    maybeAdd('deals', () => searchDeals(this.prisma, query, limit));
    maybeAdd('products', () => searchProducts(this.prisma, query, limit));
    maybeAdd('finance', () => searchFinance(this.prisma, user, query, limit));
    maybeAdd('credentials', () =>
      searchCredentials(this.credentialsRuntime, credentialsAccessFromUser(user), query, limit),
    );

    return runners;
  }

  private sortHits(items: SearchHit[]): SearchHit[] {
    return [...items].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }
}
