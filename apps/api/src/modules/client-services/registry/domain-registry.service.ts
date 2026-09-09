import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { actorContextFromMachine, type ActorContext } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { decideRegistryApply } from './domain-registry.apply';
import { CRON_MAX_LOOKUPS_PER_RUN, WHOIS_QUERY_GAP_MS } from './domain-registry.constants';
import { buildDomainRegistryEligibleWhere } from './domain-registry.eligible';
import { isRegistrySnapshotFresh } from './domain-registry.freshness';
import { lookupDomainRegistry } from './domain-registry.lookup';
import { toRegistryCheckResult } from './domain-registry.mapper';
import { persistRegistryDecision } from './domain-registry.persist';
import { resolveLookupDomainName } from './domain-name';
import type { DomainRegistryCheckResult } from './domain-registry.types';

const SYSTEM_ACTOR = actorContextFromMachine({
  id: 'client-services-domain-registry',
  type: 'SYSTEM',
});

@Injectable()
export class DomainRegistryService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async checkService(
    serviceId: string,
    actor: ActorContext = SYSTEM_ACTOR,
    options: { force?: boolean } = {},
  ): Promise<DomainRegistryCheckResult> {
    const row = await this.loadDomainService(serviceId);
    const domainName = resolveLookupDomainName({
      linkedDomainName: row.domain?.domainName,
      serviceName: row.name,
    });
    if (!domainName) {
      throw new BadRequestException('Service name is not a valid domain');
    }
    if (!options.force && isRegistrySnapshotFresh(row.registryCheckedAt)) {
      return this.reuseSnapshot(row, domainName);
    }
    const lookup = await lookupDomainRegistry(domainName);
    const decision = decideRegistryApply({
      storedRenewalDate: row.renewalDate,
      lookup,
    });
    const checkedAt = new Date();
    const persisted = await persistRegistryDecision({
      prisma: this.prisma,
      audit: this.audit,
      serviceId: row.id,
      projectId: row.projectId,
      previousRenewalDate: row.renewalDate,
      decision,
      actor,
      checkedAt,
    });
    return toRegistryCheckResult({
      serviceId: row.id,
      domainName,
      decision,
      lookup,
      renewalDate: persisted.renewalDate,
      checkedAt,
    });
  }

  async runDueLookups(now: Date = new Date()): Promise<{
    eligibleCount: number;
    checked: DomainRegistryCheckResult[];
    failures: Array<{ serviceId: string; message: string }>;
  }> {
    const rows = await this.prisma.clientServiceRecord.findMany({
      where: buildDomainRegistryEligibleWhere(now),
      orderBy: { renewalDate: 'asc' },
      take: CRON_MAX_LOOKUPS_PER_RUN,
      select: { id: true },
    });
    const checked: DomainRegistryCheckResult[] = [];
    const failures: Array<{ serviceId: string; message: string }> = [];
    for (const [index, row] of rows.entries()) {
      if (index > 0) await sleep(WHOIS_QUERY_GAP_MS);
      try {
        checked.push(await this.checkService(row.id, SYSTEM_ACTOR, { force: true }));
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : 'Lookup failed';
        failures.push({ serviceId: row.id, message });
      }
    }
    return { eligibleCount: rows.length, checked, failures };
  }

  private async loadDomainService(serviceId: string) {
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id: serviceId },
      include: { domain: { select: { domainName: true } } },
    });
    if (!row) throw new NotFoundException('Client service not found');
    if (row.type !== 'DOMAIN') throw new BadRequestException('Registry check is only for domains');
    return row;
  }

  private reuseSnapshot(
    row: {
      id: string;
      name: string;
      renewalDate: Date | null;
      registryLookupStatus: DomainRegistryCheckResult['registryLookupStatus'] | null;
      registryExpiryDate: Date | null;
      registryCheckedAt: Date | null;
      registryLookupSource: DomainRegistryCheckResult['registryLookupSource'];
    },
    domainName: string,
  ): DomainRegistryCheckResult {
    const status = row.registryLookupStatus ?? 'FAILED';
    return {
      serviceId: row.id,
      domainName,
      outcome: status === 'NOT_FOUND' ? 'not_found' : 'unchanged',
      renewalUpdated: false,
      registryLookupStatus: status,
      registryExpiryDate: row.registryExpiryDate?.toISOString() ?? null,
      registryCheckedAt: row.registryCheckedAt?.toISOString() ?? new Date().toISOString(),
      registryLookupSource: row.registryLookupSource,
      renewalDate: row.renewalDate?.toISOString() ?? null,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
