import type { Prisma } from '@nbos/database';
import {
  profileACompanyPurgeRelationGuards,
  profileAContactPurgeRelationGuards,
  profileADealPurgeRelationGuards,
  profileALeadPurgeRelationGuards,
  profileAPartnerPurgeRelationGuards,
  profileAProjectPurgeRelationGuards,
} from './profile-a-purge-relation-guards';

export function profileARetentionCutoff(now: Date, retentionMs: number): Date {
  return new Date(now.getTime() - retentionMs);
}

function trashedPastRetention(cutoff: Date): { lt: Date; not: null } {
  return { lt: cutoff, not: null };
}

const trashedInTrash = { not: null } as const;

export function purgeableTrashedLeadWhere(now: Date, retentionMs: number): Prisma.LeadWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileALeadPurgeRelationGuards };
}

export function permanentPurgeableTrashedLeadWhere(id: string): Prisma.LeadWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileALeadPurgeRelationGuards };
}

export function purgeableTrashedDealWhere(now: Date, retentionMs: number): Prisma.DealWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileADealPurgeRelationGuards };
}

export function permanentPurgeableTrashedDealWhere(id: string): Prisma.DealWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileADealPurgeRelationGuards };
}

export function purgeableTrashedPartnerWhere(
  now: Date,
  retentionMs: number,
): Prisma.PartnerWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileAPartnerPurgeRelationGuards };
}

export function permanentPurgeableTrashedPartnerWhere(id: string): Prisma.PartnerWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileAPartnerPurgeRelationGuards };
}

export function purgeableTrashedContactWhere(
  now: Date,
  retentionMs: number,
): Prisma.ContactWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileAContactPurgeRelationGuards };
}

export function permanentPurgeableTrashedContactWhere(id: string): Prisma.ContactWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileAContactPurgeRelationGuards };
}

export function purgeableTrashedCompanyWhere(
  now: Date,
  retentionMs: number,
): Prisma.CompanyWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileACompanyPurgeRelationGuards };
}

export function permanentPurgeableTrashedCompanyWhere(id: string): Prisma.CompanyWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileACompanyPurgeRelationGuards };
}

export function purgeableTrashedProjectWhere(
  now: Date,
  retentionMs: number,
): Prisma.ProjectWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), ...profileAProjectPurgeRelationGuards };
}

export function permanentPurgeableTrashedProjectWhere(id: string): Prisma.ProjectWhereInput {
  return { id, trashedAt: trashedInTrash, ...profileAProjectPurgeRelationGuards };
}
