/**
 * Seed default KANBAN board stages (shared board, ownerId = null).
 * Usage: cd packages/database && pnpm exec tsx prisma/seed-board-stages.ts
 */
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const kanbanStages = [
  { boardType: 'KANBAN', title: 'New', color: '#3B82F6', sortOrder: 0, isDefault: true },
  { boardType: 'KANBAN', title: 'In Progress', color: '#F59E0B', sortOrder: 1, isDefault: false },
  { boardType: 'KANBAN', title: 'Done', color: '#10B981', sortOrder: 2, isDefault: false },
];

async function main() {
  const prisma = createPrismaClient() as any;
  const count = await prisma.taskBoardStage.count({
    where: { ownerId: null, boardType: 'KANBAN' },
  });
  if (count > 0) {
    console.log(`KANBAN stages already exist (${count} rows). Skipping.`);
    await prisma.$disconnect();
    return;
  }
  await prisma.taskBoardStage.createMany({ data: kanbanStages });
  console.log(`Seeded ${kanbanStages.length} default KANBAN board stages.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
