import type { PrismaClient } from '@nbos/database';

const HISTORICAL_EXPENSE_STATUSES = ['PAID', 'CANCELLED'] as const;

type PrismaDb = Pick<PrismaClient, 'expense'>;

/**
 * Copies a late-linked registrar credential onto open expenses of this service.
 * Does not overwrite an explicit credential or paid/cancelled history.
 */
export async function syncOpenExpenseCredentialFromService(
  prisma: PrismaDb,
  serviceId: string,
  credentialId: string | null | undefined,
): Promise<number> {
  const id = credentialId?.trim();
  if (!id) return 0;
  const result = await prisma.expense.updateMany({
    where: {
      clientServiceRecordId: serviceId,
      credentialId: null,
      status: { notIn: [...HISTORICAL_EXPENSE_STATUSES] },
    },
    data: { credentialId: id },
  });
  return result.count;
}
