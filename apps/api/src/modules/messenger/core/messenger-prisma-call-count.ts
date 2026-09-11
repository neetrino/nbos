const MUTATING_METHODS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

const RAW_METHODS = new Set(['$executeRaw', '$queryRaw', '$executeRawUnsafe', '$queryRawUnsafe']);

type PrismaCountState = {
  total: number;
  mutating: number;
  raw: number;
  transactions: number;
};

export type PrismaCallSnapshot = PrismaCountState & {
  byPath: Record<string, number>;
};

/**
 * Counts Prisma delegate / raw-SQL invocations on a mock client.
 * Nested includes are one `findMany`, not per-row loops.
 * `$transaction` is counted separately; BEGIN/COMMIT are not visible.
 */
export function instrumentPrismaDelegates<T extends object>(
  root: T,
): {
  prisma: T;
  snapshot: () => PrismaCallSnapshot;
} {
  const counts: PrismaCountState = { total: 0, mutating: 0, raw: 0, transactions: 0 };
  const byPath: Record<string, number> = {};
  const prisma = wrapDelegates(root, counts, byPath) as T;
  rebindInstrumentedTransaction(root, prisma, counts);
  return {
    prisma,
    snapshot: () => ({ ...counts, byPath: { ...byPath } }),
  };
}

function wrapDelegates(
  value: unknown,
  counts: PrismaCountState,
  byPath: Record<string, number>,
  path = '',
): unknown {
  if (typeof value === 'function') {
    return wrapDelegateFn(value as (...args: unknown[]) => unknown, path, counts, byPath);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === '$transaction') continue;
    out[key] = wrapDelegates(child, counts, byPath, path ? `${path}.${key}` : key);
  }
  return out;
}

function wrapDelegateFn(
  fn: (...args: unknown[]) => unknown,
  path: string,
  counts: PrismaCountState,
  byPath: Record<string, number>,
) {
  return (...args: unknown[]) => {
    counts.total += 1;
    byPath[path] = (byPath[path] ?? 0) + 1;
    const leaf = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : path;
    if (MUTATING_METHODS.has(leaf)) counts.mutating += 1;
    if (RAW_METHODS.has(leaf)) counts.raw += 1;
    return fn(...args);
  };
}

function rebindInstrumentedTransaction<T extends object>(
  root: T,
  prisma: T,
  counts: PrismaCountState,
): void {
  const original = (root as { $transaction?: unknown }).$transaction;
  if (typeof original !== 'function') return;
  (prisma as { $transaction: (...args: unknown[]) => unknown }).$transaction = (
    fn: unknown,
    ...rest: unknown[]
  ) => {
    counts.transactions += 1;
    if (typeof fn !== 'function') {
      return (original as (...args: unknown[]) => unknown)(fn, ...rest);
    }
    return (original as (cb: (tx: unknown) => unknown, ...args: unknown[]) => unknown)(
      () => (fn as (tx: unknown) => unknown)(prisma),
      ...rest,
    );
  };
}
