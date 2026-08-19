import type { Prisma } from '@nbos/database';

/** Text search OR clause shared by lead list and global search. */
export function buildLeadSearchOr(search: string): Prisma.LeadWhereInput[] {
  const ic = { contains: search, mode: 'insensitive' as const };
  return [{ name: ic }, { contactName: ic }, { email: ic }, { phone: ic }];
}
