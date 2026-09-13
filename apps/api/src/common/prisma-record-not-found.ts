const PRISMA_RECORD_NOT_FOUND = 'P2025';

/** Prisma `update`/`delete` when the `where` record is gone. */
export function isPrismaRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === PRISMA_RECORD_NOT_FOUND
  );
}
