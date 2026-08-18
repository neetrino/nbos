/** Prisma unique-constraint violation (P2002) or PostgreSQL 23505. */
export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const record = error as { code?: unknown; message?: unknown };
  if (record.code === 'P2002' || record.code === '23505') {
    return true;
  }
  const message = typeof record.message === 'string' ? record.message : '';
  return /unique constraint/i.test(message) || /duplicate key/i.test(message);
}
