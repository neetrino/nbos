import { BadRequestException } from '@nestjs/common';
import type { Prisma, TransactionClient } from '@nbos/database';
import {
  normalizePhoneForStorage,
  phoneLookupVariantsFromRaw,
  phonesOverlap,
} from '../../crm/leads/lead-identity.ops';

export const CONTACT_PHONE_ERROR = {
  EMPTY: 'CONTACT_PHONE_EMPTY',
  DUPLICATE: 'CONTACT_PHONE_DUPLICATE',
} as const;

export const CONTACT_EXTRA_PHONE_SELECT = {
  id: true,
  e164: true,
  createdAt: true,
} as const;

export const CONTACT_LIST_INCLUDE = {
  extraPhones: { select: CONTACT_EXTRA_PHONE_SELECT, orderBy: { createdAt: 'asc' as const } },
  companies: { select: { id: true, name: true } },
  _count: { select: { projects: true, leads: true, deals: true } },
} as const;

export function contactDirectorySearchOr(search: string): Prisma.ContactWhereInput[] {
  const phoneMatch = contactPhoneLookupWhere(search);
  return [
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search, mode: 'insensitive' } },
    { extraPhones: { some: { e164: { contains: search } } } },
    ...(phoneMatch ? [phoneMatch] : []),
  ];
}

export interface ContactPhoneRow {
  id: string;
  e164: string;
  createdAt: Date;
}

/** Match Contact.phone or any extra ContactPhone (ATS/WhatsApp variants). */
export function contactAnyPhoneOr(variants: string[]): Prisma.ContactWhereInput {
  return {
    OR: [{ phone: { in: variants } }, { extraPhones: { some: { e164: { in: variants } } } }],
  };
}

export function contactPhoneLookupWhere(
  raw: string | null | undefined,
): Prisma.ContactWhereInput | null {
  const variants = phoneLookupVariantsFromRaw(raw);
  if (variants.length === 0) return null;
  return contactAnyPhoneOr(variants);
}

export function contactOwnsPhone(
  primary: string | null | undefined,
  extras: Array<{ e164: string }>,
  candidate: string,
): boolean {
  if (phonesOverlap(primary, candidate)) return true;
  return extras.some((phone) => phonesOverlap(phone.e164, candidate));
}

export function assertStoredContactPhone(raw: string | null | undefined): string {
  const stored = normalizePhoneForStorage(raw);
  if (!stored) {
    throw new BadRequestException({
      statusCode: 400,
      code: CONTACT_PHONE_ERROR.EMPTY,
      message: 'Phone is required.',
    });
  }
  return stored;
}

export async function createExtraContactPhone(
  db: Pick<TransactionClient, 'contactPhone'>,
  contactId: string,
  e164: string,
): Promise<ContactPhoneRow> {
  return db.contactPhone.create({
    data: { contactId, e164 },
    select: CONTACT_EXTRA_PHONE_SELECT,
  });
}

export async function deleteOverlappingExtraPhones(
  db: Pick<TransactionClient, 'contactPhone'>,
  contactId: string,
  raw: string | null | undefined,
): Promise<void> {
  const variants = phoneLookupVariantsFromRaw(raw);
  if (variants.length === 0) return;
  await db.contactPhone.deleteMany({
    where: { contactId, e164: { in: variants } },
  });
}
