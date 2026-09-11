import type { PrismaClient, TransactionClient } from '@nbos/database';
import { MESSENGER_WRITE_ISOLATION_READ_COMMITTED } from './messenger-core-revision.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;
type WriteFn<T> = (tx: PrismaLike) => Promise<T>;

const writeTxClients = new WeakSet<object>();

export function runMessengerWriteTx<T>(prisma: PrismaLike, fn: WriteFn<T>): Promise<T> {
  if (writeTxClients.has(prisma)) return fn(prisma);
  if (typeof prisma.$transaction !== 'function') return fn(prisma);
  // Prisma 7 reads `this._engineConfig`; never extract `$transaction`.
  return prisma.$transaction(
    async (tx: TransactionClient) => {
      writeTxClients.add(tx);
      try {
        return await fn(tx as PrismaLike);
      } finally {
        writeTxClients.delete(tx);
      }
    },
    {
      isolationLevel: MESSENGER_WRITE_ISOLATION_READ_COMMITTED,
    },
  );
}

export function runMessengerReadTx<T>(prisma: PrismaLike, fn: WriteFn<T>): Promise<T> {
  return runMessengerWriteTx(prisma, fn);
}
