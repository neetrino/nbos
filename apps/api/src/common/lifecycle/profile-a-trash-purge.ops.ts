import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../../modules/audit/audit.service';
import { resolveRetentionMsForEntity } from './platform-retention-rules.resolver';
import {
  purgeableTrashedCompanyWhere,
  purgeableTrashedContactWhere,
  purgeableTrashedDealWhere,
  purgeableTrashedLeadWhere,
  purgeableTrashedPartnerWhere,
  purgeableTrashedProjectWhere,
} from './profile-a-purgeable-where';

export const PROFILE_A_PURGE_BATCH_CAP = 50;

export interface ProfileAPurgeSliceResult {
  key: string;
  purged: number;
  candidateIds: string[];
}

type ProfileAPurgeSpec = {
  key: string;
  entityType: string;
  auditAction: string;
  buildWhere: (now: Date, retentionMs: number) => object;
};

const PROFILE_A_PURGE_SPECS: ProfileAPurgeSpec[] = [
  {
    key: 'lead',
    entityType: 'lead',
    auditAction: 'lead.retention_purged',
    buildWhere: purgeableTrashedLeadWhere,
  },
  {
    key: 'deal',
    entityType: 'deal',
    auditAction: 'deal.retention_purged',
    buildWhere: purgeableTrashedDealWhere,
  },
  {
    key: 'partner',
    entityType: 'partner',
    auditAction: 'partner.retention_purged',
    buildWhere: purgeableTrashedPartnerWhere,
  },
  {
    key: 'contact',
    entityType: 'contact',
    auditAction: 'contact.retention_purged',
    buildWhere: purgeableTrashedContactWhere,
  },
  {
    key: 'company',
    entityType: 'company',
    auditAction: 'company.retention_purged',
    buildWhere: purgeableTrashedCompanyWhere,
  },
  {
    key: 'project',
    entityType: 'project',
    auditAction: 'project.retention_purged',
    buildWhere: purgeableTrashedProjectWhere,
  },
];

/** Hard-purges Profile A entities past retention when purgeable guards pass. */
export async function purgeProfileATrashPastRetention(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  now: Date,
): Promise<ProfileAPurgeSliceResult[]> {
  const slices: ProfileAPurgeSliceResult[] = [];

  for (const spec of PROFILE_A_PURGE_SPECS) {
    const retentionMs = resolveRetentionMsForEntity(spec.key);
    if (retentionMs == null) {
      slices.push({ key: spec.key, purged: 0, candidateIds: [] });
      continue;
    }
    slices.push(
      await purgeEntityBatch(prisma, auditService, spec, spec.buildWhere(now, retentionMs)),
    );
  }

  return slices;
}

async function purgeEntityBatch(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  spec: ProfileAPurgeSpec,
  where: object,
): Promise<ProfileAPurgeSliceResult> {
  const candidates = await findCandidates(prisma, spec.key, where);
  if (candidates.length === 0) {
    return { key: spec.key, purged: 0, candidateIds: [] };
  }

  const ids = candidates.map((row) => row.id);
  const purged = (await deleteManyByKey(prisma, spec.key, ids)).count;

  await Promise.all(
    candidates.slice(0, purged).map((row) =>
      auditService.log({
        entityType: spec.entityType,
        entityId: row.id,
        action: spec.auditAction,
        projectId: row.projectId ?? undefined,
        changes: { scheduled: true },
      }),
    ),
  );

  return { key: spec.key, purged, candidateIds: ids.slice(0, purged) };
}

async function findCandidates(
  prisma: InstanceType<typeof PrismaClient>,
  key: string,
  where: object,
): Promise<{ id: string; projectId?: string | null }[]> {
  if (key === 'lead') {
    return prisma.lead.findMany({
      where,
      select: { id: true },
      orderBy: { trashedAt: 'asc' },
      take: PROFILE_A_PURGE_BATCH_CAP,
    });
  }
  if (key === 'deal') {
    return prisma.deal.findMany({
      where,
      select: { id: true, projectId: true },
      orderBy: { trashedAt: 'asc' },
      take: PROFILE_A_PURGE_BATCH_CAP,
    });
  }
  if (key === 'partner') {
    return prisma.partner.findMany({
      where,
      select: { id: true },
      orderBy: { trashedAt: 'asc' },
      take: PROFILE_A_PURGE_BATCH_CAP,
    });
  }
  if (key === 'contact') {
    return prisma.contact.findMany({
      where,
      select: { id: true },
      orderBy: { trashedAt: 'asc' },
      take: PROFILE_A_PURGE_BATCH_CAP,
    });
  }
  if (key === 'company') {
    return prisma.company.findMany({
      where,
      select: { id: true },
      orderBy: { trashedAt: 'asc' },
      take: PROFILE_A_PURGE_BATCH_CAP,
    });
  }
  return prisma.project.findMany({
    where,
    select: { id: true },
    orderBy: { trashedAt: 'asc' },
    take: PROFILE_A_PURGE_BATCH_CAP,
  });
}

async function deleteManyByKey(
  prisma: InstanceType<typeof PrismaClient>,
  key: string,
  ids: string[],
): Promise<{ count: number }> {
  if (key === 'lead') return prisma.lead.deleteMany({ where: { id: { in: ids } } });
  if (key === 'deal') return prisma.deal.deleteMany({ where: { id: { in: ids } } });
  if (key === 'partner') return prisma.partner.deleteMany({ where: { id: { in: ids } } });
  if (key === 'contact') return prisma.contact.deleteMany({ where: { id: { in: ids } } });
  if (key === 'company') return prisma.company.deleteMany({ where: { id: { in: ids } } });
  return prisma.project.deleteMany({ where: { id: { in: ids } } });
}
