import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient, TransactionClient } from '@nbos/database';
import type { ContactMergeFieldChoices } from '@nbos/shared';
import type { AuditService } from '../../audit/audit.service';
import { CONTACT_EXTRA_PHONE_SELECT, contactDirectorySearchOr } from './contact-phone.ops';
import { resolveContactMergeFields } from './contact-merge-fields.ops';
import {
  assertCanMergeContacts,
  assertContactMergeEligible,
  assertContactMergePair,
} from './contact-merge-guards.ops';
import { moveContactMergeRelations } from './contact-merge-relations.ops';

const MERGE_CONTACT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  role: true,
  notes: true,
  messengerLinks: true,
  trashedAt: true,
  mergedIntoId: true,
  extraPhones: { select: CONTACT_EXTRA_PHONE_SELECT },
} as const;

const CANDIDATE_LIMIT = 20;

export interface MergeContactsInput {
  survivorId: string;
  absorbedId: string;
  fieldChoices: ContactMergeFieldChoices;
  actorId: string;
  actorRoleSlug: string;
  isPlatformOwner?: boolean;
}

export interface ContactMergeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: string;
}

/**
 * Merge absorbed into survivor: field picks, extra-phone union, re-point FKs,
 * then `mergedIntoId` + Profile A Trash. No hard delete. No Deal↔Deal merge.
 */
export async function mergeContacts(
  prisma: InstanceType<typeof PrismaClient>,
  audit: AuditService,
  input: MergeContactsInput,
): Promise<{ survivorId: string; absorbedId: string }> {
  assertContactMergePair(input.survivorId, input.absorbedId);
  assertCanMergeContacts(input.actorRoleSlug, input.isPlatformOwner === true);

  const result = await prisma.$transaction((tx) => runContactMerge(tx, input));

  await audit.log({
    entityType: 'contact',
    entityId: result.survivorId,
    action: 'contact.merged',
    userId: input.actorId,
    changes: {
      absorbedId: result.absorbedId,
      survivorId: result.survivorId,
      fieldChoices: result.fieldChoices,
      extraPhones: result.extraPhones,
      companies: result.relations.companies,
      billingCompanies: result.relations.billingCompanies,
      projects: result.relations.projects,
      leads: result.relations.leads,
      deals: result.relations.deals,
      extraPhoneCount: result.relations.extraPhones,
      additionalLinks: result.relations.additionalLinks,
    },
  });

  return { survivorId: result.survivorId, absorbedId: result.absorbedId };
}

export async function findContactMergeCandidates(
  db: Pick<TransactionClient, 'contact'>,
  query: { q?: string; excludeId?: string },
): Promise<ContactMergeCandidate[]> {
  const search = query.q?.trim();
  if (!search) return [];
  const where: Prisma.ContactWhereInput = {
    trashedAt: null,
    mergedIntoId: null,
    OR: contactDirectorySearchOr(search),
  };
  if (query.excludeId) where.id = { not: query.excludeId };
  return db.contact.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      role: true,
    },
    take: CANDIDATE_LIMIT,
    orderBy: { updatedAt: 'desc' },
  });
}

async function runContactMerge(tx: TransactionClient, input: MergeContactsInput) {
  const [survivor, absorbed] = await Promise.all([
    loadMergeContact(tx, input.survivorId),
    loadMergeContact(tx, input.absorbedId),
  ]);
  assertContactMergeEligible(survivor, 'survivor');
  assertContactMergeEligible(absorbed, 'absorbed');

  const resolved = resolveContactMergeFields(survivor, absorbed, input.fieldChoices);
  const relations = await moveContactMergeRelations(
    tx,
    survivor.id,
    absorbed.id,
    resolved.extraPhoneE164,
  );

  await tx.contact.update({
    where: { id: survivor.id },
    data: {
      firstName: resolved.firstName,
      lastName: resolved.lastName,
      phone: resolved.phone,
      email: resolved.email,
      role: resolved.role,
      notes: resolved.notes,
      messengerLinks: resolved.messengerLinks === null ? undefined : resolved.messengerLinks,
    },
  });
  await tx.contact.update({
    where: { id: absorbed.id },
    data: { mergedIntoId: survivor.id, trashedAt: new Date() },
  });

  return {
    survivorId: survivor.id,
    absorbedId: absorbed.id,
    fieldChoices: input.fieldChoices,
    extraPhones: resolved.extraPhoneE164,
    relations,
  };
}

async function loadMergeContact(tx: TransactionClient, id: string) {
  const contact = await tx.contact.findUnique({
    where: { id },
    select: MERGE_CONTACT_SELECT,
  });
  if (!contact) throw new NotFoundException(`Contact ${id} not found`);
  return contact;
}
