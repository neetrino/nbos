import type { Prisma, PrismaClient, TransactionClient } from '@nbos/database';
import type { ActorContext } from '@nbos/shared';
import type { AuditService } from '../../audit/audit.service';
import type { DomainRegistryApplyDecision } from './domain-registry.types';

type DbClient = Pick<PrismaClient, 'clientServiceRecord' | 'domain'> | TransactionClient;

export async function persistRegistryDecision(args: {
  prisma: DbClient;
  audit: AuditService;
  serviceId: string;
  projectId: string;
  previousRenewalDate: Date | null;
  decision: DomainRegistryApplyDecision;
  actor: ActorContext;
  checkedAt: Date;
}): Promise<{ renewalDate: Date | null }> {
  const nextRenewalDate =
    args.decision.outcome === 'updated' ? args.decision.nextRenewalDate : args.previousRenewalDate;

  const data: Prisma.ClientServiceRecordUpdateInput = {
    registryLookupStatus: args.decision.persistStatus,
    registryExpiryDate: args.decision.persistExpiry,
    registryLookupSource: args.decision.persistSource,
    registryCheckedAt: args.checkedAt,
    ...(args.decision.outcome === 'updated' && nextRenewalDate
      ? { renewalDate: nextRenewalDate }
      : {}),
  };

  await args.prisma.clientServiceRecord.update({ where: { id: args.serviceId }, data });

  if (args.decision.outcome === 'updated' && nextRenewalDate) {
    await args.prisma.domain.updateMany({
      where: { clientServiceRecordId: args.serviceId },
      data: { expiryDate: nextRenewalDate },
    });
    await args.audit.log({
      entityType: 'client_service_record',
      entityId: args.serviceId,
      action: 'domain.registry.renewal_date_updated',
      actor: args.actor,
      projectId: args.projectId,
      changes: {
        previousRenewalDate: args.previousRenewalDate?.toISOString() ?? null,
        renewalDate: nextRenewalDate.toISOString(),
        source: args.decision.persistSource,
      },
    });
  }

  return { renewalDate: nextRenewalDate };
}
