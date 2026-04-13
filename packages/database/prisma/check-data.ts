import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function main() {
  const prisma = createPrismaClient();
  const projects = await (
    prisma as unknown as {
      project: {
        findMany: (
          args: unknown,
        ) => Promise<
          Array<{ id: string; code: string; name: string; _count: { products: number } }>
        >;
      };
    }
  ).project.findMany({
    select: { id: true, code: true, name: true, _count: { select: { products: true } } },
    orderBy: { code: 'asc' },
  });
  for (const p of projects) {
    console.log(`${p.id}  ${p.code}  ${p.name}  products: ${p._count.products}`);
  }
  await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect();
}

main();
