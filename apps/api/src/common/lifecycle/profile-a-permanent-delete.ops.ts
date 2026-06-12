import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../../modules/audit/audit.service';
import {
  permanentPurgeableTrashedCompanyWhere,
  permanentPurgeableTrashedContactWhere,
  permanentPurgeableTrashedDealWhere,
  permanentPurgeableTrashedLeadWhere,
  permanentPurgeableTrashedPartnerWhere,
  permanentPurgeableTrashedProjectWhere,
} from './profile-a-purgeable-where';

export type ProfileAPermanentDeleteKey =
  | 'contact'
  | 'company'
  | 'lead'
  | 'deal'
  | 'partner'
  | 'project';

const PROFILE_A_PERMANENT_DELETE_SPECS: ReadonlyArray<{
  key: ProfileAPermanentDeleteKey;
  label: string;
  entityType: string;
  auditAction: string;
}> = [
  {
    key: 'contact',
    label: 'Contact',
    entityType: 'contact',
    auditAction: 'contact.permanently_deleted',
  },
  {
    key: 'company',
    label: 'Company',
    entityType: 'company',
    auditAction: 'company.permanently_deleted',
  },
  { key: 'lead', label: 'Lead', entityType: 'lead', auditAction: 'lead.permanently_deleted' },
  { key: 'deal', label: 'Deal', entityType: 'deal', auditAction: 'deal.permanently_deleted' },
  {
    key: 'partner',
    label: 'Partner',
    entityType: 'partner',
    auditAction: 'partner.permanently_deleted',
  },
  {
    key: 'project',
    label: 'Project',
    entityType: 'project',
    auditAction: 'project.permanently_deleted',
  },
];

function specForKey(key: ProfileAPermanentDeleteKey) {
  const spec = PROFILE_A_PERMANENT_DELETE_SPECS.find((row) => row.key === key);
  if (!spec) {
    throw new Error(`Unknown Profile A permanent delete key: ${key}`);
  }
  return spec;
}

/** Hard-deletes a trashed Profile A row when relation guards pass (manual purge, no retention wait). */
export async function permanentlyDeleteProfileATrashedEntity(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  params: { key: ProfileAPermanentDeleteKey; id: string; userId: string },
): Promise<void> {
  const spec = specForKey(params.key);
  const purgeable = await findPurgeableRow(prisma, params.key, params.id);
  if (purgeable) {
    await deleteRow(prisma, params.key, params.id);
    await auditService.log({
      entityType: spec.entityType,
      entityId: params.id,
      action: spec.auditAction,
      userId: params.userId,
      projectId: purgeable.projectId ?? undefined,
      changes: { manual: true },
    });
    return;
  }

  const trashedAt = await readTrashedAt(prisma, params.key, params.id);
  if (trashedAt === undefined) {
    throw new NotFoundException(`${spec.label} ${params.id} not found`);
  }
  if (trashedAt === null) {
    throw new BadRequestException(`${spec.label} is not in Trash.`);
  }
  throw new ConflictException(
    `${spec.label} cannot be permanently deleted while related records still exist.`,
  );
}

async function findPurgeableRow(
  prisma: InstanceType<typeof PrismaClient>,
  key: ProfileAPermanentDeleteKey,
  id: string,
): Promise<{ projectId?: string | null } | null> {
  if (key === 'contact') {
    const row = await prisma.contact.findFirst({
      where: permanentPurgeableTrashedContactWhere(id),
      select: { id: true },
    });
    return row ? {} : null;
  }
  if (key === 'company') {
    const row = await prisma.company.findFirst({
      where: permanentPurgeableTrashedCompanyWhere(id),
      select: { id: true },
    });
    return row ? {} : null;
  }
  if (key === 'lead') {
    const row = await prisma.lead.findFirst({
      where: permanentPurgeableTrashedLeadWhere(id),
      select: { id: true },
    });
    return row ? {} : null;
  }
  if (key === 'deal') {
    const row = await prisma.deal.findFirst({
      where: permanentPurgeableTrashedDealWhere(id),
      select: { id: true, projectId: true },
    });
    return row ? { projectId: row.projectId } : null;
  }
  if (key === 'partner') {
    const row = await prisma.partner.findFirst({
      where: permanentPurgeableTrashedPartnerWhere(id),
      select: { id: true },
    });
    return row ? {} : null;
  }
  const row = await prisma.project.findFirst({
    where: permanentPurgeableTrashedProjectWhere(id),
    select: { id: true },
  });
  return row ? {} : null;
}

async function readTrashedAt(
  prisma: InstanceType<typeof PrismaClient>,
  key: ProfileAPermanentDeleteKey,
  id: string,
): Promise<Date | null | undefined> {
  if (key === 'contact') {
    return (await prisma.contact.findUnique({ where: { id }, select: { trashedAt: true } }))
      ?.trashedAt;
  }
  if (key === 'company') {
    return (await prisma.company.findUnique({ where: { id }, select: { trashedAt: true } }))
      ?.trashedAt;
  }
  if (key === 'lead') {
    return (await prisma.lead.findUnique({ where: { id }, select: { trashedAt: true } }))
      ?.trashedAt;
  }
  if (key === 'deal') {
    return (await prisma.deal.findUnique({ where: { id }, select: { trashedAt: true } }))
      ?.trashedAt;
  }
  if (key === 'partner') {
    return (await prisma.partner.findUnique({ where: { id }, select: { trashedAt: true } }))
      ?.trashedAt;
  }
  return (await prisma.project.findUnique({ where: { id }, select: { trashedAt: true } }))
    ?.trashedAt;
}

async function deleteRow(
  prisma: InstanceType<typeof PrismaClient>,
  key: ProfileAPermanentDeleteKey,
  id: string,
): Promise<void> {
  if (key === 'contact') {
    await prisma.contact.delete({ where: { id } });
    return;
  }
  if (key === 'company') {
    await prisma.company.delete({ where: { id } });
    return;
  }
  if (key === 'lead') {
    await prisma.lead.delete({ where: { id } });
    return;
  }
  if (key === 'deal') {
    await prisma.deal.delete({ where: { id } });
    return;
  }
  if (key === 'partner') {
    await prisma.partner.delete({ where: { id } });
    return;
  }
  await prisma.project.delete({ where: { id } });
}
