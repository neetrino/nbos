import type { PrismaClient } from '@nbos/database';
import { MESSENGER_WRITE_ISOLATION_READ_COMMITTED } from './messenger-core-revision.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;
type WriteFn<T> = (tx: PrismaLike) => Promise<T>;

const writeTxClients = new WeakSet<object>();

export function runMessengerWriteTx<T>(prisma: PrismaLike, fn: WriteFn<T>): Promise<T> {
  if (writeTxClients.has(prisma)) return fn(prisma);
  const start = (prisma as { $transaction?: PrismaLike['$transaction'] }).$transaction;
  if (typeof start !== 'function') return fn(prisma);
  return start(
    async (tx) => {
      writeTxClients.add(tx);
      try {
        return await fn(tx as PrismaLike);
      } finally {
        writeTxClients.delete(tx);
      }
    },
    { isolationLevel: MESSENGER_WRITE_ISOLATION_READ_COMMITTED },
  );
}

export function runMessengerReadTx<T>(prisma: PrismaLike, fn: WriteFn<T>): Promise<T> {
  return runMessengerWriteTx(prisma, fn);
}
